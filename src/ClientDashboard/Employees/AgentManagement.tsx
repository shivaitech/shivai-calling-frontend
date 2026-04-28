import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";

import appToast from "../../components/AppToast";
import { extractTextWithUnstructured } from "../../services/unstructuredService";
import {
  useParams,
  useNavigate,
  useLocation,
  Navigate,
  useSearchParams,
} from "react-router-dom";
import GlassCard from "../../components/GlassCard";
import SearchableSelect from "../../components/SearchableSelect";
import Pagination from "../../components/Pagination";
import {
  AgentQRModal,
} from "./agents";
import AgentViewPage from "./AgentViewPage";
import { useAgent } from "../../contexts/AgentContext";
import { useAuth } from "../../contexts/AuthContext";
import {
  aiEmployeeTemplates,
  getMatchingTemplatesWithScore,
  TemplateMatchResult,
} from "../../constants/aiEmployeeTemplates";
import {
  aiTemplateService,
  GeneratedTemplate,
} from "../../services/aiTemplateService";
import { isDeveloperUser, formatAgentLanguages } from "../../lib/utils";
import {
  liveKitService,
  LiveKitMessage,
  LiveKitCallbacks,
} from "../../services/liveKitService";
import { agentAPI } from "../../services/agentAPI";
import {
  Bot,
  Play,
  Pause,
  Square,
  Eye,
  Edit,
  Edit2,
  Trash2,
  Copy,
  MessageSquare,
  Globe,
  Zap,
  CheckCircle,
  Plus,
  Search,
  Filter,
  X,
  Building2,
  Briefcase,
  Factory,
  Layers,
  Link,
  Share2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Sparkles,
  ArrowRight,
  FileText,
  Image,
  Upload,
  File,
  UploadCloud,
  PauseCircle,
  QrCode,
  Minimize2,
  AlertTriangle,
} from "lucide-react";

const AGENTS_PER_PAGE = 6;

// Detailed voice-style descriptions — used both in the system prompt and as voice_instruction
const VOICE_STYLE_SP_MAP: Record<string, string> = {
  friendly:      'Speak in a warm, welcoming tone that makes callers feel comfortable and valued. Use conversational language, positive affirmations, and show genuine interest in helping. Maintain an upbeat but not overwhelming energy level.',
  professional:  'Maintain a formal, business-like tone throughout all interactions. Speak clearly and confidently with proper grammar. Avoid slang or overly casual expressions. Project expertise and reliability while remaining approachable.',
  casual:        'Speak in a relaxed, laid-back manner as if talking to a friend. Use everyday language and contractions freely. Keep the conversation light and natural while still being helpful and informative.',
  authoritative: 'Speak with confidence and clarity. Project expertise with direct, clear statements. Use a measured, deliberate pace and avoid filler words. Lead conversations decisively while remaining respectful and solution-focused.',
  empathetic:    'Lead with empathy and emotional awareness. Acknowledge feelings and concerns before offering solutions. Use active listening phrases and validate the caller\'s experience. Speak in a calm, reassuring tone.',
  enthusiastic:  'Bring high energy and genuine excitement to every interaction. Use expressive, positive language and let your enthusiasm be contagious. Celebrate wins with the caller and maintain an optimistic, can-do attitude throughout.',
};

// Country list with flags and STT provider info
// stt: "deepgram" = Deepgram STT (major languages), "sarvam" = Deepgram (major) + Sarvam (regional) for India
const ALL_COUNTRIES = [
  { code: "IN",  name: "India",          flag: "🇮🇳", stt: "sarvam" },
  { code: "US",  name: "United States",  flag: "🇺🇸", stt: "deepgram" },
  { code: "GB",  name: "United Kingdom", flag: "🇬🇧", stt: "deepgram" },
  { code: "AU",  name: "Australia",      flag: "🇦🇺", stt: "deepgram" },
  { code: "CA",  name: "Canada",         flag: "🇨🇦", stt: "deepgram" },
  { code: "ES",  name: "Spain",          flag: "🇪🇸", stt: "deepgram" },
  { code: "MX",  name: "Mexico",         flag: "🇲🇽", stt: "deepgram" },
  { code: "AR",  name: "Argentina",      flag: "🇦🇷", stt: "deepgram" },
  { code: "CO",  name: "Colombia",       flag: "🇨🇴", stt: "deepgram" },
  { code: "FR",  name: "France",         flag: "🇫🇷", stt: "deepgram" },
  { code: "BE",  name: "Belgium",        flag: "🇧🇪", stt: "deepgram" },
  { code: "DE",  name: "Germany",        flag: "🇩🇪", stt: "deepgram" },
  { code: "AT",  name: "Austria",        flag: "🇦🇹", stt: "deepgram" },
  { code: "CH",  name: "Switzerland",    flag: "🇨🇭", stt: "deepgram" },
  { code: "IT",  name: "Italy",          flag: "🇮🇹", stt: "deepgram" },
  { code: "PT",  name: "Portugal",       flag: "🇵🇹", stt: "deepgram" },
  { code: "BR",  name: "Brazil",         flag: "🇧🇷", stt: "deepgram" },
  { code: "NL",  name: "Netherlands",    flag: "🇳🇱", stt: "deepgram" },
  { code: "PL",  name: "Poland",         flag: "🇵🇱", stt: "deepgram" },
  { code: "RU",  name: "Russia",         flag: "🇷🇺", stt: "deepgram" },
  { code: "UA",  name: "Ukraine",        flag: "🇺🇦", stt: "deepgram" },
  { code: "JP",  name: "Japan",          flag: "🇯🇵", stt: "deepgram" },
  { code: "KR",  name: "South Korea",    flag: "🇰🇷", stt: "deepgram" },
  { code: "CN",  name: "China",          flag: "🇨🇳", stt: "deepgram" },
  { code: "TW",  name: "Taiwan",         flag: "🇹🇼", stt: "deepgram" },
  { code: "SA",  name: "Saudi Arabia",   flag: "🇸🇦", stt: "deepgram" },
  { code: "AE",  name: "United Arab Emirates", flag: "🇦🇪", stt: "deepgram" },
  { code: "EG",  name: "Egypt",          flag: "🇪🇬", stt: "deepgram" },
  { code: "BD",  name: "Bangladesh",     flag: "🇧🇩", stt: "deepgram" },
  { code: "PK",  name: "Pakistan",       flag: "🇵🇰", stt: "deepgram" },
  { code: "TR",  name: "Turkey",         flag: "🇹🇷", stt: "deepgram" },
  { code: "IL",  name: "Israel",         flag: "🇮🇱", stt: "deepgram" },
  { code: "SE",  name: "Sweden",         flag: "🇸🇪", stt: "deepgram" },
  { code: "NO",  name: "Norway",         flag: "🇳🇴", stt: "deepgram" },
  { code: "DK",  name: "Denmark",        flag: "🇩🇰", stt: "deepgram" },
  { code: "FI",  name: "Finland",        flag: "🇫🇮", stt: "deepgram" },
  { code: "GR",  name: "Greece",         flag: "🇬🇷", stt: "deepgram" },
  { code: "CZ",  name: "Czech Republic", flag: "🇨🇿", stt: "deepgram" },
  { code: "HU",  name: "Hungary",        flag: "🇭🇺", stt: "deepgram" },
  { code: "RO",  name: "Romania",        flag: "🇷🇴", stt: "deepgram" },
  { code: "TH",  name: "Thailand",       flag: "🇹🇭", stt: "deepgram" },
  { code: "VN",  name: "Vietnam",        flag: "🇻🇳", stt: "deepgram" },
  { code: "ID",  name: "Indonesia",      flag: "🇮🇩", stt: "deepgram" },
  { code: "MY",  name: "Malaysia",       flag: "🇲🇾", stt: "deepgram" },
  { code: "PH",  name: "Philippines",    flag: "🇵🇭", stt: "deepgram" },
  { code: "BG",  name: "Bulgaria",       flag: "🇧🇬", stt: "deepgram" },
  { code: "HR",  name: "Croatia",        flag: "🇭🇷", stt: "deepgram" },
  { code: "RS",  name: "Serbia",         flag: "🇷🇸", stt: "deepgram" },
  { code: "SK",  name: "Slovakia",       flag: "🇸🇰", stt: "deepgram" },
  { code: "SI",  name: "Slovenia",       flag: "🇸🇮", stt: "deepgram" },
  { code: "EE",  name: "Estonia",        flag: "🇪🇪", stt: "deepgram" },
  { code: "LV",  name: "Latvia",         flag: "🇱🇻", stt: "deepgram" },
  { code: "LT",  name: "Lithuania",      flag: "🇱🇹", stt: "deepgram" },
];

// Language list — each entry maps to one or more countryCodes
const ALL_LANGUAGES: { value: string; label: string; flag: string; countryCodes: string[] }[] = [
  // English
  { value: "en-US",  label: "English (US)",        flag: "🇺🇸", countryCodes: ["US"] },
  { value: "en-GB",  label: "English (UK)",         flag: "🇬🇧", countryCodes: ["GB"] },
  { value: "en-AU",  label: "English (Australia)",  flag: "🇦🇺", countryCodes: ["AU"] },
  { value: "en-CA",  label: "English (Canada)",     flag: "🇨🇦", countryCodes: ["CA"] },
  // Spanish (one code covers all Spanish-speaking countries)
  { value: "es",     label: "Spanish",              flag: "🇪🇸", countryCodes: ["ES", "MX", "AR", "CO"] },
  // French
  { value: "fr",     label: "French",               flag: "🇫🇷", countryCodes: ["FR", "CA", "BE"] },
  // German
  { value: "de",     label: "German",               flag: "🇩🇪", countryCodes: ["DE", "AT", "CH"] },
  // Italian
  { value: "it",     label: "Italian",              flag: "🇮🇹", countryCodes: ["IT"] },
  // Portuguese
  { value: "pt",     label: "Portuguese",           flag: "🇵🇹", countryCodes: ["PT", "BR"] },
  // Dutch
  { value: "nl",     label: "Dutch",                flag: "🇳🇱", countryCodes: ["NL", "BE"] },
  // Polish
  { value: "pl",     label: "Polish",               flag: "🇵🇱", countryCodes: ["PL"] },
  // Russian
  { value: "ru",     label: "Russian",              flag: "🇷🇺", countryCodes: ["RU"] },
  // Ukrainian
  { value: "uk",     label: "Ukrainian",            flag: "🇺🇦", countryCodes: ["UA"] },
  // Japanese
  { value: "ja",     label: "Japanese",             flag: "🇯🇵", countryCodes: ["JP"] },
  // Korean
  { value: "ko",     label: "Korean",               flag: "🇰🇷", countryCodes: ["KR"] },
  // Chinese
  { value: "zh",     label: "Chinese",              flag: "🇨🇳", countryCodes: ["CN", "TW"] },
  // Arabic
  { value: "ar",     label: "Arabic",               flag: "🇸🇦", countryCodes: ["SA", "AE", "EG"] },
  // Turkish
  { value: "tr",     label: "Turkish",              flag: "🇹🇷", countryCodes: ["TR"] },
  // Hebrew
  { value: "he",     label: "Hebrew",               flag: "🇮🇱", countryCodes: ["IL"] },
  // Scandinavian
  { value: "sv",     label: "Swedish",              flag: "🇸🇪", countryCodes: ["SE"] },
  { value: "nb",     label: "Norwegian",            flag: "🇳🇴", countryCodes: ["NO"] },
  { value: "da",     label: "Danish",               flag: "🇩🇰", countryCodes: ["DK"] },
  { value: "fi",     label: "Finnish",              flag: "🇫🇮", countryCodes: ["FI"] },
  // Eastern European
  { value: "el",     label: "Greek",                flag: "🇬🇷", countryCodes: ["GR"] },
  { value: "cs",     label: "Czech",                flag: "🇨🇿", countryCodes: ["CZ"] },
  { value: "hu",     label: "Hungarian",            flag: "🇭🇺", countryCodes: ["HU"] },
  { value: "ro",     label: "Romanian",             flag: "🇷🇴", countryCodes: ["RO"] },
  { value: "bg",     label: "Bulgarian",            flag: "🇧🇬", countryCodes: ["BG"] },
  { value: "hr",     label: "Croatian",             flag: "🇭🇷", countryCodes: ["HR"] },
  { value: "sr",     label: "Serbian",              flag: "🇷🇸", countryCodes: ["RS"] },
  { value: "sk",     label: "Slovak",               flag: "🇸🇰", countryCodes: ["SK"] },
  { value: "sl",     label: "Slovenian",            flag: "🇸🇮", countryCodes: ["SI"] },
  { value: "et",     label: "Estonian",             flag: "🇪🇪", countryCodes: ["EE"] },
  { value: "lv",     label: "Latvian",              flag: "🇱🇻", countryCodes: ["LV"] },
  { value: "lt",     label: "Lithuanian",           flag: "🇱🇹", countryCodes: ["LT"] },
  // South-East Asian
  { value: "th",     label: "Thai",                 flag: "🇹🇭", countryCodes: ["TH"] },
  { value: "vi",     label: "Vietnamese",           flag: "🇻🇳", countryCodes: ["VN"] },
  { value: "id",     label: "Indonesian",           flag: "🇮🇩", countryCodes: ["ID"] },
  // Indian languages (Sarvam STT + Google TTS)
  { value: "en-IN",  label: "English (India)",      flag: "🇮🇳", countryCodes: ["IN"] },
  { value: "hi",     label: "Hindi",                flag: "🇮🇳", countryCodes: ["IN"] },
  { value: "ta",     label: "Tamil",                flag: "🇮🇳", countryCodes: ["IN"] },
  { value: "te",     label: "Telugu",               flag: "🇮🇳", countryCodes: ["IN"] },
  { value: "mr",     label: "Marathi",              flag: "🇮🇳", countryCodes: ["IN"] },
  { value: "bn",     label: "Bengali",              flag: "🇮🇳", countryCodes: ["IN", "BD"] },
  { value: "gu",     label: "Gujarati",             flag: "🇮🇳", countryCodes: ["IN"] },
  { value: "kn",     label: "Kannada",              flag: "🇮🇳", countryCodes: ["IN"] },
  { value: "ml",     label: "Malayalam",            flag: "🇮🇳", countryCodes: ["IN"] },
  { value: "pa",     label: "Punjabi",              flag: "🇮🇳", countryCodes: ["IN"] },
];

// Voice-language affinity map — best Gemini voice per language per gender
/** Replace the ## Voice Instructions section in a system prompt with our predefined content.
 *  If no such section exists, injects it right after the Identity section. */
function replaceVoiceSection(prompt: string, voiceStyle: string): string {
  if (!prompt) return prompt;
  const content = VOICE_STYLE_SP_MAP[voiceStyle] || VOICE_STYLE_SP_MAP['friendly'];

  // Case 1: section already exists (AI generated one despite instructions) — replace it
  const replacePattern = /(##?\s*Voice Instructions[^\n]*\n)([\s\S]*?)(?=\n##?\s|\n---\s*\n|$)/i;
  if (replacePattern.test(prompt)) {
    return prompt.replace(replacePattern, `$1\n${content}\n\n`);
  }

  // Case 2: no section found — inject after the Identity section
  const identityPattern = /(Identity[^\n]*\n[\s\S]*?)(?=\n(?:Voice|Core|Natural|Human|Scenario|Company|When|Communication|##))/i;
  if (identityPattern.test(prompt)) {
    return prompt.replace(identityPattern, `$1\n\nVoice Instructions\n${content}\n`);
  }

  // Fallback: prepend at top
  return `Voice Instructions\n${content}\n\n${prompt}`;
}

const AgentManagement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    agents,
    currentAgent,
    setCurrentAgent,
    publishAgentStatus,
    unpublishAgentStatus,
    refreshAgents,
    deleteAgent,
  } = useAgent();
  const { user } = useAuth();

  // Check if current user is developer
  const isDeveloper = true; // Open to all users

  const isTrain = location.pathname.includes("/train");
  const isView = id && !isTrain;
  const isList = !id; // Main agent list page

  const [_formData, setFormData] = useState({
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

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [genderFilter, setGenderFilter] = useState("all");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Server-side filtered agents state
  const [filteredAgents, setFilteredAgents] = useState<any[]>([]);
  const [totalAgents, setTotalAgents] = useState(0);
  // Increment to force fetchFilteredAgents to re-run (e.g. after agent creation)
  const [agentListRefreshToken, setAgentListRefreshToken] = useState(0);
  // Ref kept in sync with context agents — used in fetchFilteredAgents fallback
  // WITHOUT adding `agents` to the callback dep array (avoids stale-filter race on publish/pause)
  const agentsRef = useRef<any[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);

  // Pagination state - read from URL query params
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showTestChat, setShowTestChat] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [agentToPublish, setAgentToPublish] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const [agentToPause, setAgentToPause] = useState<string | null>(null);
  const [isPausing, setIsPausing] = useState(false);
  const [showIntegrationCodeModal, setShowIntegrationCodeModal] = useState(false);
  const [agentForIntegration, setAgentForIntegration] = useState<string | null>(null);
  const [activeTestTab, setActiveTestTab] = useState<"call" | "conversation">(
    "call",
  );
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callTimerInterval, setCallTimerInterval] = useState<number | null>(
    null,
  );
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      text: string;
      isUser: boolean;
      timestamp: Date;
      source?: string;
    }>
  >([
    {
      id: "1",
      text: `Hello! I am ${
        currentAgent?.name || "your AI assistant"
      }${user?.company ? ` from ${user.company}` : ""}, here to assist you. How can I help you today?`,
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [testInput, setTestInput] = useState("");
  const recentMessagesRef = useRef<Set<string>>(new Set());
  const lastMessageTimeRef = useRef<number>(0);
  const [isTestLoading, setIsTestLoading] = useState(false);

  // Quick Create Modal State
  const [showQuickCreateModal, setShowQuickCreateModal] = useState(false);
  const [quickCreateStep, setQuickCreateStep] = useState(1);
  const [businessProcessSlideIndex, setBusinessProcessSlideIndex] = useState(0);
  const [industrySlideIndex, setIndustrySlideIndex] = useState(0);
  const [subIndustrySlideIndex, setSubIndustrySlideIndex] = useState(0);
  const [templateSlideIndex, setTemplateSlideIndex] = useState(0);
  const [quickCreateData, setQuickCreateData] = useState({
    companyName: "",
    useCompanyNameForTemplate: true,
    aiEmployeeName: "",
    countries: [] as string[],
    languages: ["en-US"] as string[],
    voice: "Achernar",
    realtimeVoice: "alloy",
    voiceSpeed: 1.0,
    voiceStyle: "friendly",
    gender: "female",
    businessProcess: "",
    industry: "",
    subIndustry: "",
    websiteUrls: [""],
    socialMediaUrls: [""],
    uploadedFiles: [] as File[],
    uploadedFileUrls: [] as string[],
    extractedFileContent: "" as string, // Extracted text from uploaded files
    extractedWebsiteContent: "" as string, // Crawled content from websites
    selectedTemplate: null as string | null,
  });
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [isExtractingContent, setIsExtractingContent] = useState(false);
  const [fileQualityErrors, setFileQualityErrors] = useState<{ fileName: string; issues: string[] }[]>([]);
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [isLoadingVoicePreview, setIsLoadingVoicePreview] = useState(false);
  const voicePreviewAudioRef = useRef<HTMLAudioElement | null>(null);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [langSearch, setLangSearch] = useState("");
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const [voiceSelectOpen, setVoiceSelectOpen] = useState(false);
  const [realtimeVoiceSelectOpen, setRealtimeVoiceSelectOpen] = useState(false);

  // Function to preview Gemini TTS voice
  const previewGeminiVoice = async (voiceName: string, speed: number = 1.0, customText?: string) => {
    // Stop any currently playing audio
    if (voicePreviewAudioRef.current) {
      voicePreviewAudioRef.current.pause();
      voicePreviewAudioRef.current = null;
    }

    setIsTestingVoice(true);
    setIsLoadingVoicePreview(true);

    try {
      const sampleText = customText || `Hello! I'm ${quickCreateData.aiEmployeeName || 'your AI assistant'}. How can I help you today?`;

      console.log(`🎙️ Voice preview: voiceName=${voiceName}, speed=${speed}`);

      // Get auth token same as other API calls
      const authTokens = localStorage.getItem('auth_tokens');
      const accessToken = authTokens ? JSON.parse(authTokens)?.accessToken : null;

      const response = await fetch('https://nodejs.service.callshivai.com/api/v1/voice/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          voiceName: voiceName,
          text: sampleText,
        }),
      });

      if (!response.ok) {
        throw new Error(`Voice preview failed: ${response.status}`);
      }

      // Response: { success, data: { audioDataUrl, audioBase64, audioFormat, ... } }
      const json = await response.json();
      const audioData = json.data;
      let audioUrl: string;
      let isDataUrl = false;

      if (audioData?.audioDataUrl) {
        // Use the ready-made data URL directly
        audioUrl = audioData.audioDataUrl;
        isDataUrl = true;
      } else if (audioData?.audioBase64) {
        const byteChars = atob(audioData.audioBase64);
        const byteNums = new Array(byteChars.length).fill(0).map((_, i) => byteChars.charCodeAt(i));
        const byteArray = new Uint8Array(byteNums);
        audioUrl = URL.createObjectURL(new Blob([byteArray], { type: 'audio/mp3' }));
      } else {
        throw new Error('No audio data in response');
      }

      // Create and play audio
      const audio = new Audio(audioUrl);
      voicePreviewAudioRef.current = audio;

      audio.oncanplay = () => {
        setIsLoadingVoicePreview(false);
      };

      audio.onended = () => {
        setIsTestingVoice(false);
        setIsLoadingVoicePreview(false);
        if (!isDataUrl) URL.revokeObjectURL(audioUrl);
        voicePreviewAudioRef.current = null;
      };

      audio.onerror = () => {
        setIsTestingVoice(false);
        setIsLoadingVoicePreview(false);
        if (!isDataUrl) URL.revokeObjectURL(audioUrl);
        voicePreviewAudioRef.current = null;
        appToast.error('Failed to play voice preview');
      };

      await audio.play();
      setIsLoadingVoicePreview(false);
    } catch (error) {
      console.error('❌ Voice preview error:', error);
      setIsTestingVoice(false);
      setIsLoadingVoicePreview(false);
      appToast.error('Voice preview unavailable. Please try again later.');
    }
  };

  // Stop voice preview
  const stopVoicePreview = () => {
    if (voicePreviewAudioRef.current) {
      voicePreviewAudioRef.current.pause();
      voicePreviewAudioRef.current = null;
    }
    setIsTestingVoice(false);
    setIsLoadingVoicePreview(false);
  };

  // Template Details Modal State
  const [showTemplateDetails, setShowTemplateDetails] = useState(false);
  const [selectedTemplateForDetails, setSelectedTemplateForDetails] = useState<
    string | null
  >(null);
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [editedTemplate, setEditedTemplate] =
    useState<Partial<GeneratedTemplate> | null>(null);
  const [activeTemplateSection, setActiveTemplateSection] = useState('overview');
  const templateContentRef = useRef<HTMLDivElement>(null);

  const openAgentTestPage = () => {
    if (!currentAgent?.id) return;
    // Trigger widget config save before opening test page
    window.dispatchEvent(new CustomEvent("shivai:save-widget-config", { detail: { agentId: currentAgent.id } }));
    const params = new URLSearchParams();
    params.set("agentId", currentAgent.id);
    if (user?.id) params.set("userId", user.id);
    const url = `/MyAIEmployee/${currentAgent.id}?${params.toString()}`;
    // Small delay to let save fire before navigating
    setTimeout(() => window.open(url, "_blank", "noopener,noreferrer"), 300);
  };

  // Template section navigation tabs
  const templateSections = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
    { id: 'system-prompt', label: 'System Prompt', icon: '🤖' },
    { id: 'first-message', label: 'First Message', icon: '💬' },
    { id: 'knowledge', label: 'Knowledge', icon: '📚' },
    { id: 'scripts', label: 'Scripts', icon: '📝' },
    { id: 'training', label: 'Training', icon: '🎯' },
  ];

  // Scroll to section in template details
  const scrollToTemplateSection = (sectionId: string) => {
    const element = document.getElementById(`template-section-${sectionId}`);
    const container = templateContentRef.current;
    if (element && container) {
      const containerTop = container.getBoundingClientRect().top;
      const elementTop = element.getBoundingClientRect().top;
      const offset = elementTop - containerTop + container.scrollTop - 10;
      container.scrollTo({ top: offset, behavior: 'smooth' });
      setActiveTemplateSection(sectionId);
    }
  };

  // Handle scroll to update active section
  const handleTemplateScroll = useCallback(() => {
    const container = templateContentRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const containerTop = containerRect.top;
    const threshold = 120; // How far from top a section must be to be considered "active"
    
    // Find the last section that has scrolled past the threshold
    let activeSection = templateSections[0].id;
    
    for (const section of templateSections) {
      const element = document.getElementById(`template-section-${section.id}`);
      if (element) {
        const elementRect = element.getBoundingClientRect();
        const relativeTop = elementRect.top - containerTop;
        
        // If this section's top is at or above the threshold, it becomes the active one
        // We continue iterating to find the last one that meets this criteria
        if (relativeTop <= threshold) {
          activeSection = section.id;
        }
      }
    }
    
    setActiveTemplateSection(activeSection);
  }, []);

  // AI-Generated Templates State
  const [aiGeneratedTemplates, setAIGeneratedTemplates] = useState<
    GeneratedTemplate[]
  >([]);
  const [isGeneratingTemplates, setIsGeneratingTemplates] = useState(false);
  const [isGeneratingSystemPrompts, setIsGeneratingSystemPrompts] = useState(false);
  // Tracks which template names have received their final system prompt from the BG callback
  const [spReadyTemplates, setSpReadyTemplates] = useState<Set<string>>(new Set());
  const [generationProgress, setGenerationProgress] = useState(0);
  const [templateGenerationError, setTemplateGenerationError] = useState<
    string | null
  >(null);

  // Helper function to replace template placeholders with actual values
  const replaceTemplatePlaceholders = (text: string | undefined): string => {
    if (!text) return "";
    return text
      .replace(/\[AI Employee Name\]/g, quickCreateData.aiEmployeeName || "AI Assistant")
      .replace(/\[Company Name\]/g, quickCreateData.companyName || "Company")
      .replace(/\[Company\]/g, quickCreateData.companyName || "Company")
      .replace(/\[Business Name\]/g, quickCreateData.companyName || "Company")
      .replace(/\[Store Name\]/g, quickCreateData.companyName || "Company")
      .replace(/\[Clinic Name\]/g, quickCreateData.companyName || "Company")
      .replace(/\[Real Estate Company\]/g, quickCreateData.companyName || "Company")
      .replace(/\[Agent Name\]/g, quickCreateData.aiEmployeeName || "AI Assistant");
  };

  // Business Process Options
  const businessProcessOptions = [
    { value: "customer-support", label: "Customer Support", icon: "🎧" },
    { value: "sales-marketing", label: "Sales & Marketing", icon: "💼" },
    { value: "appointment-setting", label: "Appointment Setting", icon: "📅" },
    { value: "lead-qualification", label: "Lead Qualification", icon: "🎯" },
    { value: "technical-support", label: "Technical Support", icon: "🔧" },
    { value: "order-processing", label: "Order Processing", icon: "📦" },
    { value: "billing-inquiries", label: "Billing Inquiries", icon: "💳" },
    { value: "onboarding", label: "Customer Onboarding", icon: "🚀" },
  ];

  // Voice Options by Gender
  const voiceOptions = {
    female: [
      { value: "Achernar", label: "Achernar" },
      { value: "Aoede", label: "Aoede" },
      { value: "Autonoe", label: "Autonoe" },
      { value: "Callirrhoe", label: "Callirrhoe" },
      { value: "Despina", label: "Despina" },
      { value: "Erinome", label: "Erinome" },
      { value: "Gacrux", label: "Gacrux" },
      { value: "Kore", label: "Kore" },
      { value: "Laomedeia", label: "Laomedeia" },
      { value: "Leda", label: "Leda" },
      { value: "Pulcherrima", label: "Pulcherrima" },
      { value: "Sulafat", label: "Sulafat" },
      { value: "Vindemiatrix", label: "Vindemiatrix" },
      { value: "Zephyr", label: "Zephyr" },
    ],
    male: [
      { value: "Achird", label: "Achird" },
      { value: "Algenib", label: "Algenib" },
      { value: "Algieba", label: "Algieba" },
      { value: "Alnilam", label: "Alnilam" },
      { value: "Charon", label: "Charon" },
      { value: "Enceladus", label: "Enceladus" },
      { value: "Fenrir", label: "Fenrir" },
      { value: "Iapetus", label: "Iapetus" },
      { value: "Orus", label: "Orus" },
      { value: "Puck", label: "Puck" },
      { value: "Rasalgethi", label: "Rasalgethi" },
      { value: "Sadachbia", label: "Sadachbia" },
      { value: "Sadaltager", label: "Sadaltager" },
      { value: "Schedar", label: "Schedar" },
      { value: "Umbriel", label: "Umbriel" },
      { value: "Zubenelgenubi", label: "Zubenelgenubi" },
    ],
  };

  // Realtime Preview API TTS voices (used when "multilingual" language is selected)
  const realtimeTTSVoices = {
    female: [
      { value: "alloy",   label: "Alloy" },
      { value: "coral",   label: "Coral" },
      { value: "sage",    label: "Sage" },
      { value: "shimmer", label: "Shimmer" },
    ],
    male: [
      { value: "ash",     label: "Ash" },
      { value: "ballad",  label: "Ballad" },
      { value: "echo",    label: "Echo" },
      { value: "verse",   label: "Verse" },
    ],
  };

  // Multilingual voices - these voices support non-English languages
  const multilingualVoices = {
    female: ["Aoede", "Kore", "Leda", "Zephyr"],
    male: ["Puck", "Charon", "Fenrir", "Orus"],
  };

  // English-only language codes
  const englishOnlyLanguages = ["en-US", "en-GB", "en-IN", "en-AU", "en-CA"];

  // Check if any selected language requires multilingual voices
  const isMultilingualLanguage = quickCreateData.languages.some(
    (lang) => !englishOnlyLanguages.includes(lang)
  );

  // True when user selects the special "multilingual" option → use Realtime TTS voices
  const isMultilingualMode = quickCreateData.languages.includes("multilingual");

  // Get filtered voice options based on selected language, with "Best for X" suggestions
  const getFilteredVoiceOptions = (gender: 'female' | 'male') => {
    return isMultilingualLanguage
      ? voiceOptions[gender].filter((v) => multilingualVoices[gender].includes(v.value))
      : voiceOptions[gender];
  };

  // Industry Options
  const industryOptions = [
    { value: "real-estate", label: "Real Estate", icon: "🏠" },
    { value: "healthcare", label: "Healthcare", icon: "🏥" },
    { value: "dental", label: "Dental", icon: "🦷" },
    { value: "fitness", label: "Fitness & Wellness", icon: "💪" },
    { value: "education", label: "Education", icon: "🎓" },
    { value: "finance", label: "Finance & Banking", icon: "🏦" },
    { value: "insurance", label: "Insurance", icon: "🛡️" },
    { value: "ecommerce", label: "E-commerce", icon: "🛒" },
    { value: "retail", label: "Retail", icon: "🏪" },
    { value: "technology", label: "Technology", icon: "💻" },
    { value: "saas", label: "SaaS", icon: "☁️" },
    { value: "legal", label: "Legal Services", icon: "⚖️" },
    { value: "hospitality", label: "Hospitality", icon: "🏨" },
    { value: "restaurants", label: "Restaurants", icon: "🍽️" },
    { value: "automotive", label: "Automotive", icon: "🚗" },
    { value: "beauty", label: "Beauty & Salon", icon: "💇" },
    { value: "home-services", label: "Home Services", icon: "🏠" },
    { value: "other", label: "Other", icon: "📋" },
  ];

  // Sub-Industry Options
  const subIndustryOptions: Record<string, { value: string; label: string }[]> =
    {
      "real-estate": [
        { value: "residential", label: "Residential Sales" },
        { value: "commercial", label: "Commercial Real Estate" },
        { value: "property-management", label: "Property Management" },
        { value: "luxury-real-estate", label: "Luxury Real Estate" },
        { value: "vacation-rentals", label: "Vacation Rentals" },
        { value: "real-estate-investment", label: "Real Estate Investment" },
        { value: "land-sales", label: "Land & Lot Sales" },
        { value: "real-estate-appraisal", label: "Real Estate Appraisal" },
      ],
      healthcare: [
        { value: "hospitals", label: "Hospitals" },
        { value: "clinics", label: "General Clinics" },
        { value: "mental-health", label: "Mental Health Services" },
        { value: "home-healthcare", label: "Home Healthcare" },
        { value: "urgent-care", label: "Urgent Care Centers" },
        { value: "specialized-clinics", label: "Specialized Clinics" },
        { value: "diagnostic-centers", label: "Diagnostic Centers" },
        { value: "rehabilitation", label: "Rehabilitation Centers" },
        { value: "telemedicine", label: "Telemedicine" },
        { value: "nursing-homes", label: "Nursing Homes" },
      ],
      dental: [
        { value: "general-dentistry", label: "General Dentistry" },
        { value: "orthodontics", label: "Orthodontics" },
        { value: "cosmetic-dentistry", label: "Cosmetic Dentistry" },
        { value: "pediatric-dentistry", label: "Pediatric Dentistry" },
        { value: "periodontics", label: "Periodontics" },
        { value: "endodontics", label: "Endodontics" },
        { value: "oral-surgery", label: "Oral Surgery" },
        { value: "dental-implants", label: "Dental Implants" },
      ],
      fitness: [
        { value: "gyms", label: "Gyms & Fitness Centers" },
        { value: "yoga-studios", label: "Yoga Studios" },
        { value: "personal-training", label: "Personal Training" },
        { value: "crossfit", label: "CrossFit Gyms" },
        { value: "pilates", label: "Pilates Studios" },
        { value: "martial-arts", label: "Martial Arts & Boxing" },
        { value: "dance-studios", label: "Dance Studios" },
        { value: "sports-facilities", label: "Sports Facilities" },
        { value: "wellness-centers", label: "Wellness Centers" },
      ],
      education: [
        { value: "k12", label: "K-12 Schools" },
        { value: "higher-education", label: "Higher Education" },
        { value: "online-learning", label: "Online Learning Platforms" },
        { value: "tutoring", label: "Tutoring Services" },
        { value: "vocational-training", label: "Vocational Training" },
        { value: "language-schools", label: "Language Schools" },
        { value: "test-prep", label: "Test Preparation" },
        { value: "preschool", label: "Preschool & Daycare" },
      ],
      finance: [
        { value: "banking", label: "Banking Services" },
        { value: "investment", label: "Investment Services" },
        { value: "wealth-management", label: "Wealth Management" },
        { value: "accounting", label: "Accounting Services" },
        { value: "financial-planning", label: "Financial Planning" },
        { value: "tax-services", label: "Tax Services" },
        { value: "mortgage-lending", label: "Mortgage Lending" },
        { value: "credit-unions", label: "Credit Unions" },
      ],
      insurance: [
        { value: "health-insurance", label: "Health Insurance" },
        { value: "life-insurance", label: "Life Insurance" },
        { value: "auto-insurance", label: "Auto Insurance" },
        { value: "property-insurance", label: "Property Insurance" },
        { value: "business-insurance", label: "Business Insurance" },
        { value: "travel-insurance", label: "Travel Insurance" },
        { value: "disability-insurance", label: "Disability Insurance" },
      ],
      ecommerce: [
        { value: "fashion", label: "Fashion & Apparel" },
        { value: "electronics", label: "Electronics" },
        { value: "food-beverage", label: "Food & Beverage" },
        { value: "home-decor", label: "Home Decor" },
        { value: "beauty-products", label: "Beauty Products" },
        { value: "sporting-goods", label: "Sporting Goods" },
        { value: "toys-games", label: "Toys & Games" },
        { value: "books-media", label: "Books & Media" },
        { value: "pet-supplies", label: "Pet Supplies" },
      ],
      retail: [
        { value: "grocery", label: "Grocery Stores" },
        { value: "fashion-retail", label: "Fashion Retail" },
        { value: "electronics-retail", label: "Electronics Retail" },
        { value: "home-improvement", label: "Home Improvement" },
        { value: "department-stores", label: "Department Stores" },
        { value: "specialty-retail", label: "Specialty Retail" },
        { value: "convenience-stores", label: "Convenience Stores" },
        { value: "furniture-stores", label: "Furniture Stores" },
      ],
      technology: [
        { value: "software-development", label: "Software Development" },
        { value: "it-services", label: "IT Services & Consulting" },
        { value: "cybersecurity", label: "Cybersecurity" },
        { value: "cloud-services", label: "Cloud Services" },
        { value: "data-analytics", label: "Data Analytics" },
        { value: "ai-ml", label: "AI & Machine Learning" },
        { value: "mobile-development", label: "Mobile App Development" },
        { value: "web-development", label: "Web Development" },
      ],
      saas: [
        { value: "crm", label: "CRM Software" },
        { value: "erp", label: "ERP Software" },
        { value: "marketing-automation", label: "Marketing Automation" },
        { value: "project-management", label: "Project Management" },
        { value: "hr-software", label: "HR & Payroll Software" },
        { value: "accounting-software", label: "Accounting Software" },
        { value: "collaboration-tools", label: "Collaboration Tools" },
        { value: "analytics-platforms", label: "Analytics Platforms" },
      ],
      legal: [
        { value: "corporate-law", label: "Corporate Law" },
        { value: "family-law", label: "Family Law" },
        { value: "immigration-law", label: "Immigration Law" },
        { value: "criminal-law", label: "Criminal Defense" },
        { value: "real-estate-law", label: "Real Estate Law" },
        { value: "estate-planning", label: "Estate Planning" },
        { value: "personal-injury", label: "Personal Injury" },
        { value: "intellectual-property", label: "Intellectual Property" },
      ],
      hospitality: [
        { value: "hotels", label: "Hotels & Motels" },
        { value: "resorts", label: "Resorts & Spas" },
        { value: "event-venues", label: "Event Venues" },
        { value: "bed-breakfast", label: "Bed & Breakfast" },
        { value: "vacation-rentals", label: "Vacation Rentals" },
        { value: "hostels", label: "Hostels" },
        { value: "conference-centers", label: "Conference Centers" },
      ],
      restaurants: [
        { value: "fine-dining", label: "Fine Dining" },
        { value: "casual-dining", label: "Casual Dining" },
        { value: "fast-food", label: "Fast Food & QSR" },
        { value: "cafes", label: "Cafes & Coffee Shops" },
        { value: "food-trucks", label: "Food Trucks" },
        { value: "bakeries", label: "Bakeries & Pastry Shops" },
        { value: "catering", label: "Catering Services" },
        { value: "bars-pubs", label: "Bars & Pubs" },
        { value: "buffets", label: "Buffets" },
      ],
      automotive: [
        { value: "dealerships", label: "Car Dealerships" },
        { value: "auto-repair", label: "Auto Repair & Maintenance" },
        { value: "car-rental", label: "Car Rental Services" },
        { value: "auto-parts", label: "Auto Parts & Accessories" },
        { value: "car-wash", label: "Car Wash & Detailing" },
        { value: "body-shops", label: "Body Shops & Collision Repair" },
        { value: "tire-services", label: "Tire Services" },
        { value: "oil-change", label: "Oil Change & Lube" },
        { value: "auto-glass", label: "Auto Glass Repair" },
        { value: "towing", label: "Towing Services" },
      ],
      beauty: [
        { value: "hair-salons", label: "Hair Salons" },
        { value: "nail-salons", label: "Nail Salons" },
        { value: "med-spas", label: "Medical Spas" },
        { value: "barbershops", label: "Barbershops" },
        { value: "day-spas", label: "Day Spas" },
        { value: "cosmetics", label: "Cosmetics & Makeup" },
        { value: "tattoo-piercing", label: "Tattoo & Piercing" },
        { value: "waxing", label: "Waxing & Threading" },
        { value: "aesthetic-clinics", label: "Aesthetic Clinics" },
      ],
      "home-services": [
        { value: "plumbing", label: "Plumbing Services" },
        { value: "electrical", label: "Electrical Services" },
        { value: "hvac", label: "HVAC Services" },
        { value: "cleaning", label: "Cleaning Services" },
        { value: "landscaping", label: "Landscaping & Lawn Care" },
        { value: "pest-control", label: "Pest Control" },
        { value: "roofing", label: "Roofing Services" },
        { value: "painting", label: "Painting Services" },
        { value: "moving", label: "Moving Services" },
        { value: "handyman", label: "Handyman Services" },
        { value: "carpet-cleaning", label: "Carpet Cleaning" },
        { value: "window-cleaning", label: "Window Cleaning" },
      ],
      other: [
        { value: "general", label: "General Business" },
        { value: "custom", label: "Custom Industry" },
        { value: "non-profit", label: "Non-Profit Organization" },
        { value: "government", label: "Government Services" },
      ],
    };

  // Get matching templates with scoring based on all user selections
  const getMatchingTemplatesScored = (): TemplateMatchResult[] => {
    return getMatchingTemplatesWithScore(
      quickCreateData.businessProcess,
      quickCreateData.industry,
      quickCreateData.subIndustry,
    );
  };

  // Handle quick create wizard navigation
  const handleQuickCreateNext = async () => {
    if (quickCreateStep < 7) {
      // Validate Step 2: Voice & Language are required
      if (quickCreateStep === 2) {
        if (!quickCreateData.languages?.length || !quickCreateData.voice) {
          appToast.error('Please select at least one language and a voice before proceeding.');
          return;
        }
      }

      // Validate Step 6: Knowledge Base requires at least one file or website URL
      if (quickCreateStep === 6) {
        const hasFiles = quickCreateData.uploadedFiles.length > 0;
        const hasUrls = quickCreateData.websiteUrls.some((url) => url.trim());
        if (!hasFiles && !hasUrls) {
          appToast.error('Please upload at least one file or add a website URL to train your AI.');
          return;
        }
      }

      const nextStep = quickCreateStep + 1;
      setQuickCreateStep(nextStep);

      // Generate AI templates when moving to step 7
      if (nextStep === 7) {
        await generateAITemplates();
      }
    }
  };

  const generateAITemplates = async () => {
    setIsGeneratingTemplates(true);
    setTemplateGenerationError(null);
    setGenerationProgress(0);

    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 90) return prev;
        return Math.min(90, prev + Math.random() * 15);
      });
    }, 400);

    try {
      // Build additional context from extracted content
      let additionalContext = quickCreateData.aiEmployeeName
        ? `The AI employee will be named: ${quickCreateData.aiEmployeeName}`
        : '';
      
      // Add extracted file content to context
      if (quickCreateData.extractedFileContent) {
        const truncatedContent = quickCreateData.extractedFileContent.substring(0, 15000); // Limit to ~15k chars
        additionalContext += `\n\n--- Extracted Knowledge Base Content ---\n${truncatedContent}`;
        console.log('📚 Including extracted file content in template generation, length:', quickCreateData.extractedFileContent.length);
        console.log('📚 Extracted content preview:', quickCreateData.extractedFileContent.substring(0, 500) + '...');
      } else {
        console.log('⚠️ No extracted file content available for template generation');
      }
      
      // Add social media URLs to context
      const validSocialUrls = quickCreateData.socialMediaUrls.filter((url) => url.trim());
      if (validSocialUrls.length > 0) {
        additionalContext += `\n\nSocial Media Profiles: ${validSocialUrls.join(', ')}`;
      }

      // Set BG flag BEFORE calling generateTemplates so it's true when callbacks fire
      setIsGeneratingSystemPrompts(true);
      setSpReadyTemplates(new Set()); // Reset per-template readiness

      const templates = await aiTemplateService.generateTemplates(
        {
          companyName: quickCreateData.useCompanyNameForTemplate ? (quickCreateData.companyName || "") : "",
          businessProcess: quickCreateData.businessProcess,
          industry: quickCreateData.industry,
          subIndustry: quickCreateData.subIndustry,
          websiteUrls: quickCreateData.websiteUrls.filter((url) => url.trim()),
          additionalContext: additionalContext || undefined,
          extractedContent: quickCreateData.extractedFileContent || undefined,
          voiceStyle: quickCreateData.voiceStyle || undefined,
        },
        // Background callback: system prompts trickle in after loading is done
        (updatedTemplates) => {
          // Overwrite the Voice Instructions section in every generated system prompt
          // so the user always sees our predefined instructions in the preview.
          const patchedTemplates = updatedTemplates.map((t) =>
            t.systemPrompt
              ? { ...t, systemPrompt: replaceVoiceSection(t.systemPrompt, quickCreateData.voiceStyle) }
              : t
          );
          setAIGeneratedTemplates([...patchedTemplates]);
          // Mark each template whose SP has arrived as ready
          const newlyReady = patchedTemplates
            .filter((t) => t.systemPrompt && t.systemPrompt.length > 100)
            .map((t) => t.name);
          if (newlyReady.length > 0) {
            setSpReadyTemplates((prev) => new Set([...prev, ...newlyReady]));
          }
          // Stop global BG indicator when every template has a real system prompt
          const allReady = patchedTemplates.every(
            (t) => t.systemPrompt && t.systemPrompt.length > 100,
          );
          if (allReady) setIsGeneratingSystemPrompts(false);
        },
      );

      // ✅ Metadata is ready — stop loading immediately, show templates
      clearInterval(progressInterval);
      setGenerationProgress(100);
      setAIGeneratedTemplates(templates);
      // isGeneratingSystemPrompts already true — background callbacks will flip it false
      console.log("✅ AI template metadata ready — system prompts generating in background");
    } catch (error) {
      clearInterval(progressInterval);
      console.error("❌ Error generating AI templates:", error);
      setTemplateGenerationError(
        error instanceof Error ? error.message : "Failed to generate templates",
      );
      // Fall back to predefined templates if AI generation fails
      const fallbackTemplates = getMatchingTemplatesScored();
      setAIGeneratedTemplates(
        fallbackTemplates.map((t) => ({
          name: t.template.name,
          description: t.template.description,
          icon: t.template.icon,
          features: t.template.features,
        })),
      );
      setGenerationProgress(100);
      setIsGeneratingSystemPrompts(false); // Fallback templates have no BG generation
    } finally {
      setTimeout(() => {
        setIsGeneratingTemplates(false);
        setGenerationProgress(0);
      }, 300);
    }
  };

  const handleQuickCreateBack = () => {
    if (quickCreateStep > 1) {
      setQuickCreateStep(quickCreateStep - 1);
    }
  };

  const handleQuickCreateClose = () => {
    // Don't allow closing while creating agent
    if (isCreatingAgent) {
      return;
    }
    
    setShowQuickCreateModal(false);
    setQuickCreateStep(1);
    setBusinessProcessSlideIndex(0);
    setIndustrySlideIndex(0);
    setSubIndustrySlideIndex(0);
    setTemplateSlideIndex(0);
    setAIGeneratedTemplates([]);
    setIsGeneratingSystemPrompts(false);
    setTemplateGenerationError(null);
    setIsCreatingAgent(false);
    setKbCreationProgress(null);
    setKbFileProgress([]);
    setIsModalMinimized(false);
    setCreatingAgentId(null);
    // Clear persisted KB session
    localStorage.removeItem('kb_progress_agentId');
    localStorage.removeItem('kb_progress_agentName');
    // Close any open KB WebSocket
    if (kbWsRef.current) {
      kbWsRef.current.close();
      kbWsRef.current = null;
    }
    setIsExtractingContent(false);
    setFileQualityErrors([]);
    setQuickCreateData({
      companyName: "",
      useCompanyNameForTemplate: true,
      aiEmployeeName: "",
      countries: [],
      languages: ["en-US"],
      voice: "Achernar",
      realtimeVoice: "alloy",
      voiceSpeed: 1.0,
      voiceStyle: "friendly",
      gender: "female",
      businessProcess: "",
      industry: "",
      subIndustry: "",
      websiteUrls: [""],
      socialMediaUrls: [""],
      uploadedFiles: [],
      uploadedFileUrls: [],
      extractedFileContent: "",
      extractedWebsiteContent: "",
      selectedTemplate: null,
    });
  };

  // Extract structured text from any file using the Unstructured IO API
  const extractTextFromFile = (file: File): Promise<string> =>
    extractTextWithUnstructured(file);

  /**
   * Validate extracted file content for backend pageIndex processing issues.
   * Returns an array of human-readable issue descriptions (empty = file is ok).
   */
  const validateFileQuality = (content: string, fileName: string): string[] => {
    const issues: string[] = [];

    if (!content || content.trim().length < 30) {
      issues.push('File appears to be empty or unreadable. Please check the file and re-upload.');
      return issues;
    }

    const totalChars = content.length;
    const newlineCount = (content.match(/\n/g) || []).length;
    const newlineRatio = newlineCount / totalChars;

    // Excessive newlines relative to total content
    if (newlineRatio > 0.30) {
      issues.push(
        `Too many line breaks (${Math.round(newlineRatio * 100)}% of content are newlines). ` +
        `This can cause backend indexing failures. Please clean up the formatting and re-upload.`
      );
    }

    // Many occurrences of 4+ consecutive newlines
    const consecutiveBlankLines = (content.match(/\n{4,}/g) || []).length;
    if (consecutiveBlankLines > 20) {
      issues.push(
        `Found ${consecutiveBlankLines} sections with repeated consecutive blank lines. ` +
        `Please remove excessive blank lines and re-upload.`
      );
    }

    // Very low text density (mostly whitespace / newlines)
    const meaningfulChars = content.replace(/[\n\r\s\t]/g, '').length;
    const textDensity = meaningfulChars / totalChars;
    if (textDensity < 0.20 && totalChars > 300) {
      issues.push(
        `File has very low text density (only ${Math.round(textDensity * 100)}% actual text). ` +
        `It may be corrupted or heavily padded. Please export a clean version and re-upload.`
      );
    }

    // Suppress TypeScript "unused parameter" warning
    void fileName;

    return issues;
  };

  // Handle knowledge base file upload with quality check
  const handleKnowledgeBaseUpload = async (files: File[]) => {
    if (files.length === 0) return;

    setIsUploadingFiles(true);
    setIsExtractingContent(true);
    setFileQualityErrors([]);

    try {
      // Extract text from all files first — needed for quality check + template gen context
      console.log('📄 Checking file quality...');
      const extractedTexts = await Promise.all(files.map(extractTextFromFile));

      // Split into valid and rejected files based on quality check
      const qualityErrors: { fileName: string; issues: string[] }[] = [];
      const validFiles: File[] = [];
      const validExtractedTexts: string[] = [];

      files.forEach((file, i) => {
        const issues = validateFileQuality(extractedTexts[i], file.name);
        if (issues.length > 0) {
          qualityErrors.push({ fileName: file.name, issues });
        } else {
          validFiles.push(file);
          validExtractedTexts.push(extractedTexts[i]);
        }
      });

      if (qualityErrors.length > 0) {
        setFileQualityErrors(qualityErrors);
        appToast.error(
          `${qualityErrors.length} file(s) failed quality check. Please fix and re-upload.`,
          { duration: 6000 }
        );
      }

      if (validFiles.length === 0) return;

      // Add valid files to the list
      setQuickCreateData((prev) => ({
        ...prev,
        uploadedFiles: [...prev.uploadedFiles, ...validFiles],
      }));

      // Store extracted content silently for template generation context
      const combinedContent = validExtractedTexts
        .filter((t) => t.trim().length > 0)
        .join('\n\n--- Next Document ---\n\n');
      if (combinedContent) {
        setQuickCreateData((prev) => ({
          ...prev,
          extractedFileContent: prev.extractedFileContent
            ? `${prev.extractedFileContent}\n\n---\n\n${combinedContent}`
            : combinedContent,
        }));
      }

      // Upload valid files to the API
      const response = await agentAPI.uploadKnowledgeBase(validFiles);
      console.log('📤 Knowledge base upload response:', response);

      const urls = response.data?.files?.map((f: any) => f.url) || [];
      if (urls.length > 0) {
        setQuickCreateData((prev) => ({
          ...prev,
          uploadedFileUrls: [...prev.uploadedFileUrls, ...urls],
        }));
      }

      appToast.success(`${validFiles.length} file(s) uploaded successfully!`);
    } catch (error) {
      console.error('❌ Error uploading knowledge base files:', error);
      appToast.error('Failed to upload files. Please try again.');
    } finally {
      setIsUploadingFiles(false);
      setIsExtractingContent(false);
    }
  };

  // Handle knowledge base file removal
  const handleRemoveKnowledgeBaseFile = (index: number) => {
    setQuickCreateData((prev) => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.filter((_, i) => i !== index),
      uploadedFileUrls: prev.uploadedFileUrls.filter((_, i) => i !== index),
    }));
  };

  const handleAddWebsiteUrl = () => {
    setQuickCreateData((prev) => ({
      ...prev,
      websiteUrls: [...prev.websiteUrls, ""],
    }));
  };

  const handleRemoveWebsiteUrl = (index: number) => {
    setQuickCreateData((prev) => ({
      ...prev,
      websiteUrls: prev.websiteUrls.filter((_, i) => i !== index),
    }));
  };

  const handleWebsiteUrlChange = (index: number, value: string) => {
    setQuickCreateData((prev) => ({
      ...prev,
      websiteUrls: prev.websiteUrls.map((url, i) =>
        i === index ? value : url,
      ),
    }));
  };

  const handleAddSocialMediaUrl = () => {
    setQuickCreateData((prev) => ({
      ...prev,
      socialMediaUrls: [...prev.socialMediaUrls, ""],
    }));
  };

  const handleRemoveSocialMediaUrl = (index: number) => {
    setQuickCreateData((prev) => ({
      ...prev,
      socialMediaUrls: prev.socialMediaUrls.filter((_, i) => i !== index),
    }));
  };

  const handleSocialMediaUrlChange = (index: number, value: string) => {
    setQuickCreateData((prev) => ({
      ...prev,
      socialMediaUrls: prev.socialMediaUrls.map((url, i) =>
        i === index ? value : url,
      ),
    }));
  };

  const handleProceedToCreate = async () => {
    // Get the full template data (either edited or selected)
    let selectedTemplateData: GeneratedTemplate | null = null;

    if (quickCreateData.selectedTemplate) {
      // Try to find in AI-generated templates first
      const aiTemplate = aiGeneratedTemplates.find(
        (t) => t.name === quickCreateData.selectedTemplate,
      );
      if (aiTemplate) {
        selectedTemplateData = aiTemplate;
      } else {
        // Fallback to predefined templates
        const predefinedTemplate =
          aiEmployeeTemplates[quickCreateData.selectedTemplate];
        if (predefinedTemplate) {
          selectedTemplateData = predefinedTemplate;
        }
      }
    }

    // If no template selected, just keep modal open - user must pick a template
    if (!quickCreateData.selectedTemplate) {
      return;
    }

    // If template IS selected, create agent directly via API
    console.log('🚀 [CREATE] Starting agent creation...');
    setIsCreatingAgent(true);
    setKbFileProgress([]);
    console.log('🚀 [CREATE] isCreatingAgent set to TRUE');
    setKbCreationProgress({
      agentId: '',
      status: 'pending',
      progress: 5,
      message: 'Preparing agent configuration...',
    });
    console.log('🚀 [CREATE] Initial KB progress set');

    // Start progress simulation interval - only update percentage
    const progressInterval = setInterval(() => {
      setKbCreationProgress((prev) => {
        if (!prev) return null;
        // Gradually increase progress but cap at 95% until API completes
        const newProgress = Math.min(prev.progress + Math.random() * 15, 95);
        return {
          ...prev,
          progress: Math.floor(newProgress),
        };
      });
    }, 800);

    try {
      console.log(
        "📤 Creating agent with selected template:",
        quickCreateData.aiEmployeeName,
      );

      // Filter and prepare website URLs
      const validWebsiteUrls = quickCreateData.websiteUrls.filter(
        (url) => url.trim().length > 0,
      );

      // Filter and prepare social media URLs
      const validSocialMediaUrls = quickCreateData.socialMediaUrls.filter(
        (url) => url.trim().length > 0,
      );

      // Use the uploaded file URLs from the API
      const knowledgeBaseFileUrls = quickCreateData.uploadedFileUrls;

      // Always use Step 2 voice configuration — use module-level VOICE_STYLE_SP_MAP
      const selectedStyle = (quickCreateData.voiceStyle || "friendly").trim().toLowerCase();
      const voiceInstruction = VOICE_STYLE_SP_MAP[selectedStyle] || VOICE_STYLE_SP_MAP['friendly'];
      const clampedVoiceSpeed = Math.min(2.0, Math.max(0.5, quickCreateData.voiceSpeed ?? 1.0));

      const agentPayload = {
        name: quickCreateData.aiEmployeeName,
        gender: quickCreateData.gender || "female",
        business_process: quickCreateData.businessProcess,
        industry: quickCreateData.industry,
        sub_industry: quickCreateData.subIndustry || undefined,
        personality: selectedTemplateData?.personality || "Professional",
        language: quickCreateData.languages?.length ? quickCreateData.languages : ["en-US"],
        countries: quickCreateData.countries?.length ? quickCreateData.countries : undefined,
        voice: quickCreateData.voice || "Achernar",
        multilingual_voice: quickCreateData.languages.includes("multilingual") ? (quickCreateData.realtimeVoice || "alloy") : undefined,
        voice_config: {
          voice_instruction: voiceInstruction,
          voice_speed: clampedVoiceSpeed,
        },
        custom_instructions: replaceVoiceSection(
          replaceTemplatePlaceholders(selectedTemplateData?.systemPrompt || ""),
          selectedStyle
        ),
        guardrails_level: "medium",
        response_style: "Balanced",
        max_response_length: "Medium (150 words)",
        context_window: "Standard (8K tokens)",
        temperature: 0.5, // Must be <= 1 (temperature scale is 0-1, not 0-100)
        company_name: quickCreateData.companyName || undefined,
        // Template object with all details - replace placeholders with actual values
        template: selectedTemplateData
          ? {
              name: selectedTemplateData.name,
              description: replaceTemplatePlaceholders(selectedTemplateData.description),
              icon: selectedTemplateData.icon,
              features: selectedTemplateData.features,
              systemPrompt: replaceVoiceSection(
                replaceTemplatePlaceholders(selectedTemplateData.systemPrompt),
                selectedStyle
              ),
              firstMessage: replaceTemplatePlaceholders(selectedTemplateData.firstMessage),
              keyTalkingPoints: replaceTemplatePlaceholders(selectedTemplateData.keyTalkingPoints),
              closingScript: replaceTemplatePlaceholders(selectedTemplateData.closingScript),
              objections: selectedTemplateData.objections,
              conversationExamples: selectedTemplateData.conversationExamples,
            }
          : undefined,
        // Knowledge base URLs
        website_urls: validWebsiteUrls,
        social_media_urls: validSocialMediaUrls,
        knowledge_base_file_urls: knowledgeBaseFileUrls,
      };

      console.log("📤 Agent payload:", agentPayload);
      console.log("📄 Website URLs:", validWebsiteUrls);
      console.log("📱 Social Media URLs:", validSocialMediaUrls);
      console.log("📎 Knowledge Base Files:", knowledgeBaseFileUrls);

      // Call the agent creation API (synchronous - API handles KB creation)
      const newAgent = await agentAPI.createAgentFull(agentPayload);

      // Stop progress simulation - API completed
      clearInterval(progressInterval);

      console.log('✅ Agent created successfully:', newAgent);
      console.log('✅ New Agent ID:', newAgent?.id);

      const agentId = newAgent?.id || '';
      setCreatingAgentId(agentId);
      // Refresh context agents and re-fetch the filtered list so the new agent card
      // (with KB loading overlay) appears in the grid immediately when modal is minimized.
      refreshAgents();
      setAgentListRefreshToken((t) => t + 1);

      // Connect per-file WebSocket for real-time KB progress
      if (agentId && (quickCreateData.uploadedFileUrls.length > 0 || quickCreateData.websiteUrls.some(u => u.trim()))) {
        connectKbWebSocket(agentId, quickCreateData.aiEmployeeName || 'AI Employee');
      } else {
        // No KB files — just mark complete immediately
        localStorage.removeItem('kb_progress_agentId');
        localStorage.removeItem('kb_progress_agentName');
        setKbCreationProgress({
          agentId,
          status: 'completed',
          progress: 100,
          message: 'Agent created successfully!',
        });
        appToast.success(`${quickCreateData.aiEmployeeName} has been created successfully!`, { duration: 4000 });
        setTimeout(() => {
          handleQuickCreateClose();
          refreshAgents();
          setAgentListRefreshToken((t) => t + 1);
          navigate('/agents');
        }, 500);
      }

      console.log('✅ Agent creation complete!');
    } catch (error) {
      // Stop progress simulation on error
      clearInterval(progressInterval);

      console.error("❌ Error creating agent:", error);

      setIsCreatingAgent(false);
      setKbCreationProgress(null);

      // Show error toast
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create agent. Please try again.";
      appToast.error(errorMessage, { duration: 4000 });
    }
  };

  const canProceedToNextStep = () => {
    switch (quickCreateStep) {
      case 1:
        return (
          quickCreateData.companyName.trim().length > 0 &&
          quickCreateData.aiEmployeeName.trim().length > 0
        );
      case 2:
        return quickCreateData.languages.length > 0 && quickCreateData.voice.length > 0; // Voice configuration
      case 3:
        return quickCreateData.businessProcess.length > 0;
      case 4:
        return quickCreateData.industry.length > 0;
      case 5:
        return true; // Sub-industry is optional
      case 6:
        return true; // Website URLs are optional
      case 7: {
        // If a template is selected, block until its system prompt is ready
        if (isGeneratingSystemPrompts && quickCreateData.selectedTemplate) {
          const sel = aiGeneratedTemplates.find(
            (t) => t.name === quickCreateData.selectedTemplate,
          );
          if (!sel?.systemPrompt || sel.systemPrompt.length < 100) return false;
        }
        return true; // Template selection is optional
      }
      default:
        return false;
    }
  };

  const [publishingAgents, setPublishingAgents] = useState<Set<string>>(
    new Set(),
  );
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [kbCreationProgress, setKbCreationProgress] = useState<{
    agentId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    message?: string;
  } | null>(null);
  const [kbFileProgress, setKbFileProgress] = useState<Array<{
    file_index: number;
    file_name: string;
    file_percent: number;
    stage: string;
  }>>([]);
  const kbWsRef = useRef<WebSocket | null>(null);
  const [isModalMinimized, setIsModalMinimized] = useState(false);
  const [creatingAgentId, setCreatingAgentId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [statusMessage, setStatusMessage] = useState("Ready to connect");
  const [isMuted, setIsMuted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [room, setRoom] = useState<any>(null);
  const [_sessionHistory, setSessionHistory] = useState<any[]>([]);
  const [_sessionLoading, setSessionLoading] = useState(false);
  const [_sessionError, setSessionError] = useState<string | null>(null);
  const [_isRecording, setIsRecording] = useState(false);
  const [_testStatus, setTestStatus] = useState("📞 Ready to start call");

  useEffect(() => {
    // Setup LiveKit callbacks
    const callbacks: LiveKitCallbacks = {
      onMessage: (message: LiveKitMessage) => {
        setMessages((prev) => [
          ...prev,
          {
            id: String(message.id),
            text: message.text,
            isUser: message.isUser,
            timestamp: message.timestamp,
            source: message.source,
          },
        ]);
      },
      onConnected: () => {
        setIsCallActive(true);
        setConnectionStatus("connected");
        setStatusMessage("Connected - Speak now!");
        setIsTestLoading(false);
      },
      onDisconnected: () => {
        setIsCallActive(false);
        setConnectionStatus("disconnected");
        setStatusMessage("Disconnected");
        setIsTestLoading(false);
        if (callTimerInterval) {
          clearInterval(callTimerInterval);
          setCallTimerInterval(null);
        }
        setCallDuration(0);
      },
      onConnectionStateChange: (state) => {
        console.log("Connection state changed:", state);
      },
      onError: (error) => {
        setConnectionStatus("disconnected");
        setStatusMessage(error);
        setIsTestLoading(false);
        setIsCallActive(false);
        console.error("LiveKit error:", error);
      },
      onStatusUpdate: (status, state) => {
        setStatusMessage(status);
        setConnectionStatus(state);
      },
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

  // ── KB WebSocket helper ─────────────────────────────────────────────────────
  // Connects to the KB progress WS and drives all progress state.
  // Persists agentId + agentName to localStorage so a page reload can reconnect.
  const connectKbWebSocket = useCallback(
    (agentId: string, agentName: string) => {
      // Persist session so we can recover on reload
      localStorage.setItem('kb_progress_agentId', agentId);
      localStorage.setItem('kb_progress_agentName', agentName);

      const wsUrl = `wss://voice.callshivai.com/ws/kb-progress/${agentId}`;
      console.log('🔌 Connecting to KB progress WS:', wsUrl);

      if (kbWsRef.current) {
        kbWsRef.current.close();
        kbWsRef.current = null;
      }

      const ws = new WebSocket(wsUrl);
      kbWsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ KB progress WebSocket connected');
        setKbCreationProgress((prev) =>
          prev
            ? prev
            : { agentId, status: 'processing', progress: 10, message: 'Processing knowledge base...' }
        );
      };

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log('📡 KB WS event:', data);

          const overall = data.overall_percent ?? data.progress ?? 0;
          const stage = data.stage || data.status || '';
          const isDone = stage === 'done' || data.status === 'completed';
          const isFailed = stage === 'error' || data.status === 'failed';

          setKbCreationProgress({
            agentId,
            status: isDone ? 'completed' : isFailed ? 'failed' : 'processing',
            progress: isDone ? 100 : Math.min(Math.round(overall), 99),
            message: isDone
              ? 'Knowledge base ready!'
              : isFailed
              ? data.error || 'Processing failed'
              : data.message || `Processing... ${Math.round(overall)}%`,
          });

          if (data.file_index !== undefined) {
            setKbFileProgress((prev) => {
              const updated = [...prev];
              updated[data.file_index] = {
                file_index: data.file_index,
                file_name: data.file_name || `File ${data.file_index + 1}`,
                file_percent: data.file_percent ?? 0,
                stage: data.stage || '',
              };
              return updated;
            });
          }

          if (isDone) {
            ws.close();
            kbWsRef.current = null;
            localStorage.removeItem('kb_progress_agentId');
            localStorage.removeItem('kb_progress_agentName');
            setKbCreationProgress({ agentId, status: 'completed', progress: 100, message: 'Knowledge base ready!' });
            appToast.success(`${agentName} has been created successfully!`, { duration: 4000 });
            setTimeout(() => {
              setIsCreatingAgent(false);
              setIsModalMinimized(false);
              setCreatingAgentId(null);
              setKbCreationProgress(null);
              setKbFileProgress([]);
              setShowQuickCreateModal(false);
              refreshAgents();
              setAgentListRefreshToken((t) => t + 1);
              navigate('/agents');
            }, 1500);
          }
        } catch {
          console.warn('KB WS: could not parse message');
        }
      };

      ws.onerror = () => console.warn('⚠️ KB progress WS error');

      ws.onclose = () => {
        console.log('🔌 KB progress WS closed');
        kbWsRef.current = null;
      };

      // Fallback: 2-minute timeout
      setTimeout(() => {
        if (kbWsRef.current) {
          kbWsRef.current.close();
          kbWsRef.current = null;
        }
        localStorage.removeItem('kb_progress_agentId');
        localStorage.removeItem('kb_progress_agentName');
        setKbCreationProgress((prev) => {
          if (prev && prev.status !== 'completed') {
            appToast.success(`${agentName} has been created successfully!`, { duration: 4000 });
            setTimeout(() => {
              setIsCreatingAgent(false);
              setIsModalMinimized(false);
              setCreatingAgentId(null);
              setKbCreationProgress(null);
              setKbFileProgress([]);
              setShowQuickCreateModal(false);
              refreshAgents();
              setAgentListRefreshToken((t) => t + 1);
              navigate('/agents');
            }, 500);
            return { ...prev, status: 'completed', progress: 100, message: 'Agent created successfully!' };
          }
          return prev;
        });
      }, 120000);
    },
    [refreshAgents, navigate]
  );

  // ── Reload reconnect: restore in-progress KB session from localStorage ───────
  useEffect(() => {
    const savedAgentId = localStorage.getItem('kb_progress_agentId');
    const savedAgentName = localStorage.getItem('kb_progress_agentName');
    if (savedAgentId) {
      console.log('🔄 Restoring KB progress session for agent:', savedAgentId);
      setCreatingAgentId(savedAgentId);
      setIsCreatingAgent(true);
      setIsModalMinimized(true);
      setShowQuickCreateModal(true);
      setKbCreationProgress({
        agentId: savedAgentId,
        status: 'processing',
        progress: 10,
        message: 'Reconnecting to knowledge base processing...',
      });
      connectKbWebSocket(savedAgentId, savedAgentName || 'AI Employee');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // ─────────────────────────────────────────────────────────────────────────────

  // Prevent body scroll when any modal is open
  useEffect(() => {
    const isAnyModalOpen = (showQuickCreateModal && !isModalMinimized) || showTemplateDetails || showTestChat;
    
    if (isAnyModalOpen) {
      // Blur any currently focused element to prevent keyboard auto-open on mobile
      if (showQuickCreateModal && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      // Prevent background scrolling - comprehensive fix for mobile
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
    } else {
      // Restore scrolling when all modals are closed
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
    };
  }, [showQuickCreateModal, isModalMinimized, showTemplateDetails, showTestChat]);

  useEffect(() => {
    if (id) {
      // For view/edit pages, fetch full agent config from API
      if (isView || id) {
        const fetchAgentForEdit = async () => {
          try {
            const { agent: fetchedAgent } = await agentAPI.getAgentConfig(id);
            
            // Transform API response to match component expectations
            const transformedAgent = {
              ...fetchedAgent,
              // Map is_active to status
              status: fetchedAgent.is_active ? "Published" : "Pending",
              // Map personality to persona
              persona: fetchedAgent.personality || "Professional",
              // Ensure language is a string (API returns array)
              language: Array.isArray(fetchedAgent.language) 
                ? fetchedAgent.language[0] || "en"
                : fetchedAgent.language || "en",
              // Add default stats if missing
              stats: fetchedAgent.stats || {
                conversations: 0,
                successRate: 0,
                avgResponseTime: 0,
                activeUsers: 0,
              },
            };
            
            setCurrentAgent(transformedAgent as any);
            setFormData({
              name: transformedAgent.name,
              gender: "Female",
              businessProcess: "",
              industry: "",
              persona: transformedAgent.persona,
              language: transformedAgent.language,
              voice: transformedAgent.voice,
              customInstructions: "",
              guardrailsLevel: "Medium",
              responseStyle: "Balanced",
              maxResponseLength: "Medium (150 words)",
              contextWindow: "Standard (8K tokens)",
              temperature: 50,
            });
            // Reset messages when agent changes with correct agent name and company
            setMessages([
              {
                id: "1",
                text: `Hello! I am ${transformedAgent.name}${user?.company ? ` from ${user.company}` : ""}, here to assist you. How can I help you today?`,
                isUser: false,
                timestamp: new Date(),
              },
            ]);
            // Fetch session history for this agent
            fetchSessionHistory(transformedAgent.id);
          } catch (error) {
            console.error("Error fetching agent config:", error);
            appToast.error("Failed to load agent");
            navigate("/agents");
          }
        };
        fetchAgentForEdit();
      } else {
        // Fallback: search in local agents list
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
          // Reset messages when agent changes with correct agent name and company
          setMessages([
            {
              id: "1",
              text: `Hello! I am ${agent.name}${user?.company ? ` from ${user.company}` : ""}, here to assist you. How can I help you today?`,
              isUser: false,
              timestamp: new Date(),
            },
          ]);
          // Fetch session history for this agent
          fetchSessionHistory(agent.id);
        }
      }
    }
  }, [id, agents, setCurrentAgent]);

  // Refresh agents when navigating back from edit page
  useEffect(() => {
    if (location.state?.refresh) {
      refreshAgents();
      // Clear the state to prevent re-fetching on subsequent renders
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.refresh, refreshAgents, navigate, location.pathname]);

  // Auto-open create modal when navigated with openCreate state (e.g. from dashboard)
  useEffect(() => {
    if (location.state?.openCreate) {
      setShowQuickCreateModal(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.openCreate, navigate, location.pathname]);

  // Listen for agent updates (e.g., name change from widget customization)
  useEffect(() => {
    const handleAgentUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.agentId && currentAgent?.id === detail.agentId) {
        console.log("🔄 Agent updated event received, updating header...");
        
        // Update currentAgent with new values
        if (currentAgent) {
          setCurrentAgent({
            ...currentAgent,
            name: detail.updatedFields?.name || currentAgent.name,
            custom_instructions:
              detail.updatedFields?.custom_instructions ||
              currentAgent.custom_instructions,
            template: detail.updatedFields?.template || currentAgent.template,
          });
        }
      }
    };

    window.addEventListener("agentUpdated", handleAgentUpdate);
    return () => window.removeEventListener("agentUpdated", handleAgentUpdate);
  }, [currentAgent?.id, setCurrentAgent]);

  const fetchSessionHistory = async (agentId: string) => {
    setSessionLoading(true);
    setSessionError(null);

    try {
      const response = await agentAPI.getAgentSessions("", agentId);
      // response is already response.data.data from the API service
      // which contains { sessions: [...], pagination: {...} }
      const sessions = response?.sessions || [];
      setSessionHistory(sessions);
      console.log("✅ Session history loaded:", sessions.length, "sessions");
    } catch (error) {
      console.error("❌ Error fetching session history:", error);
      setSessionError(
        error instanceof Error
          ? error.message
          : "Failed to load session history",
      );
      setSessionHistory([]);
    } finally {
      setSessionLoading(false);
    }
  };

  const handlePublish = (agentId: string) => {
    setAgentToPublish(agentId);
    setShowPublishConfirm(true);
  };

  const handlePublishConfirm = async () => {
    if (!agentToPublish) return;

    setIsPublishing(true);
    try {
      // Trigger widget config save before publishing so widget has latest data
      window.dispatchEvent(new CustomEvent("shivai:save-widget-config", { detail: { agentId: agentToPublish } }));

      // Add to publishing set for loading state
      setPublishingAgents((prev) => new Set(prev).add(agentToPublish));

      await publishAgentStatus(agentToPublish);
      // Optimistically update filteredAgents so the UI reflects Published state
      // immediately — before refreshAgents() triggers any background re-fetch.
      const publishedId = agentToPublish;
      setFilteredAgents((prev) =>
        prev.map((a) =>
          a.id === publishedId ? { ...a, status: 'Published', is_active: true } : a
        )
      );
      // Also update currentAgent directly — the context's publishAgentStatus has a
      // stale-closure guard (currentAgent?.id === id) that can miss in some cases.
      if (currentAgent && currentAgent.id === publishedId) {
        setCurrentAgent({ ...currentAgent, status: 'Published' });
      }
      // Note: refreshAgents() intentionally omitted — publishAgentStatus() already
      // updates context agents in-memory. A server re-fetch here would race with
      // the optimistic filteredAgents update above.
      console.log("✅ Agent published successfully");
      
      // Show success toast
      appToast.success("Agent published successfully!", { duration: 3000 });
      setShowPublishConfirm(false);
      // Notify AgentViewPage (and any other listeners) of the status change
      window.dispatchEvent(new CustomEvent("agentUpdated", {
        detail: { agentId: publishedId, updatedFields: { status: 'Published', is_active: true } }
      }));
      setAgentToPublish(null);
    } catch (error: any) {
      console.error("❌ Error publishing agent:", error);
      appToast.error(error.message || "Failed to publish agent. Please try again.", { duration: 4000 });
    } finally {
      setIsPublishing(false);
      // Remove from publishing set
      setPublishingAgents((prev) => {
        const next = new Set(prev);
        next.delete(agentToPublish);
        return next;
      });
    }
  };

  const handlePublishCancel = () => {
    setShowPublishConfirm(false);
    setAgentToPublish(null);
  };

  const handlePause = (agentId: string) => {
    setAgentToPause(agentId);
    setShowPauseConfirm(true);
  };

  const handlePauseConfirm = async () => {
    if (!agentToPause) return;

    setIsPausing(true);
    try {
      // Add to publishing set for loading state
      setPublishingAgents((prev) => new Set(prev).add(agentToPause));

      await unpublishAgentStatus(agentToPause);
      // Optimistically update filteredAgents so the UI reflects Pending state immediately.
      const pausedId = agentToPause;
      setFilteredAgents((prev) =>
        prev.map((a) =>
          a.id === pausedId ? { ...a, status: 'Pending', is_active: false } : a
        )
      );
      // Also update currentAgent directly for the view page.
      if (currentAgent && currentAgent.id === pausedId) {
        setCurrentAgent({ ...currentAgent, status: 'Pending' });
      }
      // Note: refreshAgents() intentionally omitted — unpublishAgentStatus() already
      // updates context agents in-memory.
      console.log("✅ Agent paused successfully");
      
      // Show success toast
      appToast.success("Agent paused successfully!", { duration: 3000 });
      setShowPauseConfirm(false);
      // Notify AgentViewPage (and any other listeners) of the status change
      window.dispatchEvent(new CustomEvent("agentUpdated", {
        detail: { agentId: pausedId, updatedFields: { status: 'Pending', is_active: false } }
      }));
      setAgentToPause(null);
    } catch (error: any) {
      console.error("❌ Error pausing agent:", error);
      appToast.error(error.message || "Failed to pause agent. Please try again.", { duration: 4000 });
    } finally {
      setIsPausing(false);
      // Remove from publishing set
      setPublishingAgents((prev) => {
        const next = new Set(prev);
        next.delete(agentToPause);
        return next;
      });
    }
  };

  const handlePauseCancel = () => {
    setShowPauseConfirm(false);
    setAgentToPause(null);
  };

  const handleDeleteClick = (agentId: string) => {
    setAgentToDelete(agentId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!agentToDelete) return;

    setIsDeleting(true);
    const deletedId = agentToDelete;
    try {
      await deleteAgent(deletedId);
      console.log("✅ Agent deleted successfully");
      // Re-fetch the list from the server to reflect actual state
      await fetchFilteredAgents();
      refreshAgents();
      appToast.success("Agent deleted successfully!", { duration: 3000 });
      setShowDeleteConfirm(false);
      setAgentToDelete(null);

      // If we're viewing the deleted agent, navigate back to list
      if (currentAgent?.id === deletedId) {
        navigate("/agents");
      }
    } catch (error: any) {
      console.error("❌ Error deleting agent:", error);
      appToast.error(error.message || "Failed to delete agent. Please try again.", { duration: 4000 });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setAgentToDelete(null);
  };

  const handleTestSend = async () => {
    if (!testInput.trim() || isTestLoading) return;

    const message = testInput.trim();
    const now = Date.now();

    // Prevent rapid duplicate sends
    if (now - lastMessageTimeRef.current < 1000) {
      console.log("🚫 Message sent too quickly, preventing duplicate");
      return;
    }

    // Create unique message key
    const messageKey = `user-${message}-${Math.floor(now / 1000)}`; // Group by second

    if (recentMessagesRef.current.has(messageKey)) {
      console.log("🚫 Duplicate message prevented:", message);
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
        source: "chat",
      };
      setMessages((prev) => [...prev, userMessage]);

      // If connected to LiveKit room, send via room's data channel - same as widget.js
      if (room && connectionStatus === "connected") {
        const LiveKit = (window as any).LivekitClient;
        const messageData = JSON.stringify({
          type: "chat",
          text: message,
          timestamp: new Date().toISOString(),
          source: "typed",
        });

        // Send to all participants via data channel
        const encoder = new TextEncoder();
        const data = encoder.encode(messageData);
        await room.localParticipant.publishData(
          data,
          LiveKit.DataPacket_Kind.RELIABLE,
        );

        console.log("💬 Message sent via LiveKit:", message);
      } else {
        // Fallback to simulation if not connected
        setTimeout(
          () => {
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
              source: "chat",
            };

            setMessages((prev) => [...prev, agentMessage]);
            setIsTestLoading(false);
          },
          1000 + Math.random() * 2000,
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setIsTestLoading(false);
    }
  };

  // Working LiveKit connection implementation (based on your working React component)
  const startAgentCall = useCallback(async () => {
    try {
      setIsConnecting(true);
      setTestStatus("🎤 Requesting microphone access...");
      setConnectionStatus("connecting");
      setStatusMessage("Initializing call...");

      // Check if in secure context (HTTPS required for microphone)
      if (!window.isSecureContext) {
        throw new Error("HTTPS required for microphone access");
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
            sampleSize: 16,
          },
        });

        // Stop the stream - LiveKit will create its own
        stream.getTracks().forEach((track) => track.stop());
        setTestStatus("✅ Microphone access granted");
        console.log("✅ Microphone access granted");
      } catch (micError) {
        const errorMessage =
          micError instanceof Error ? micError.message : "Unknown error";
        throw new Error(`Microphone access denied: ${errorMessage}`);
      }

      // Get agent ID from the current agent
      const agentId = currentAgent?.id;
      if (!agentId) {
        throw new Error("Agent ID not found");
      }

      setTestStatus("🔗 Getting LiveKit token...");

      // Get LiveKit token from backend (exact same endpoint as working component)
      const callId = `admin_test_${Date.now()}`;
      console.log("🔑 Getting token with parameters:", {
        agent_id: agentId,
        language: "en-US",
        call_id: callId,
        device: "desktop",
      });

      const response = await fetch(
        "https://python.service.callshivai.com/token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            agent_id: agentId,
            language: "en-US",
            call_id: callId,
            device: "desktop",
            user_agent: navigator.userAgent,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Token server error:", errorText);
        throw new Error(
          `Failed to get LiveKit token: ${response.status} - ${errorText}`,
        );
      }

      const tokenData = await response.json();
      console.log("🎯 Token received for agent testing:", agentId, tokenData);

      setTestStatus("🔗 Connecting to LiveKit...");

      // Load LiveKit SDK if not available
      if (typeof (window as any).LivekitClient === "undefined") {
        setTestStatus("📦 Loading LiveKit SDK...");

        const script = document.createElement("script");
        script.src =
          "https://unpkg.com/livekit-client@latest/dist/livekit-client.umd.js";
        script.onload = () => {
          console.log("✅ LiveKit SDK loaded");
          connectToLiveKit(tokenData);
        };
        script.onerror = () => {
          throw new Error("Failed to load LiveKit SDK");
        };
        document.head.appendChild(script);
      } else {
        await connectToLiveKit(tokenData);
      }
    } catch (error) {
      console.error("Failed to start agent test call:", error);
      setTestStatus(
        `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      setConnectionStatus("disconnected");
      setStatusMessage("Connection failed");
      setIsConnecting(false);
      setIsConnected(false);
    }
  }, [currentAgent]);

  const connectToLiveKit = useCallback(
    async (tokenData: any) => {
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
            suppressLocalAudioPlayback: true,
          },
          publishDefaults: {
            audioPreset: LiveKit.AudioPresets.speech,
            dtx: true,
            red: false,
            simulcast: false,
          },
        });

        // Track remote audio (agent speaking) - same as working component
        liveKitRoom.on(LiveKit.RoomEvent.TrackSubscribed, (track: any) => {
          if (track.kind === LiveKit.Track.Kind.Audio) {
            console.log("🔊 Audio track received from agent");
            const audioElement = track.attach();
            audioElement.volume = 0.4; // Same volume as widget for feedback prevention
            audioElement.autoplay = true;
            document.body.appendChild(audioElement);

            audioElement
              .play()
              .catch((err: any) =>
                console.warn("Audio autoplay blocked:", err),
              );
          }
        });

        // Handle real-time transcript and chat data - same as widget.js
        liveKitRoom.on(
          LiveKit.RoomEvent.DataReceived,
          (data: any, participant: any) => {
            try {
              const text = new TextDecoder().decode(data);
              console.log(
                "📨 DataReceived:",
                text,
                "from:",
                participant?.identity,
              );

              if (!text || text.trim().length === 0) return;

              // Skip technical messages
              const skipPatterns = [
                "subscribed",
                "connected",
                "disconnected",
                "enabled",
                "disabled",
                "true",
                "false",
              ];
              if (
                skipPatterns.some((pattern) => text.toLowerCase() === pattern)
              )
                return;

              try {
                const jsonData = JSON.parse(text);

                // Look for text content in various fields
                let transcriptText = "";
                const textFields = [
                  "text",
                  "transcript",
                  "message",
                  "content",
                  "response",
                ];
                for (const field of textFields) {
                  if (
                    jsonData[field] &&
                    typeof jsonData[field] === "string" &&
                    jsonData[field].trim()
                  ) {
                    transcriptText = jsonData[field].trim();
                    break;
                  }
                }

                if (transcriptText) {
                  const isUser =
                    participant?.identity ===
                    liveKitRoom.localParticipant?.identity;
                  const messageKey = `${
                    isUser ? "user" : "ai"
                  }-${transcriptText}-${Math.floor(Date.now() / 2000)}`;

                  // Prevent duplicate messages within 2-second windows
                  if (recentMessagesRef.current.has(messageKey)) {
                    console.log(
                      "🚫 Preventing duplicate DataReceived:",
                      transcriptText,
                    );
                    return;
                  }

                  recentMessagesRef.current.add(messageKey);
                  setTimeout(
                    () => recentMessagesRef.current.delete(messageKey),
                    5000,
                  );

                  setMessages((prev) => [
                    ...prev,
                    {
                      id: `${Date.now()}-${Math.random()}`,
                      text: transcriptText,
                      isUser,
                      timestamp: new Date(),
                      source: "voice",
                    },
                  ]);

                  // Stop loading if this is an agent response
                  if (!isUser) {
                    setIsTestLoading(false);
                  }

                  console.log("✅ Added real-time message:", {
                    isUser,
                    text: transcriptText,
                  });
                }
              } catch (e) {
                // Treat as plain text if not JSON
                if (text.length >= 2 && text.length <= 1000) {
                  const isUser =
                    participant?.identity ===
                    liveKitRoom.localParticipant?.identity;
                  const messageKey = `${
                    isUser ? "user" : "ai"
                  }-${text.trim()}-${Math.floor(Date.now() / 2000)}`;

                  if (recentMessagesRef.current.has(messageKey)) {
                    console.log(
                      "🚫 Preventing duplicate plain text:",
                      text.trim(),
                    );
                    return;
                  }

                  recentMessagesRef.current.add(messageKey);
                  setTimeout(
                    () => recentMessagesRef.current.delete(messageKey),
                    5000,
                  );

                  setMessages((prev) => [
                    ...prev,
                    {
                      id: `${Date.now()}-${Math.random()}`,
                      text: text.trim(),
                      isUser,
                      timestamp: new Date(),
                      source: "voice",
                    },
                  ]);

                  // Stop loading if this is an agent response
                  if (!isUser) {
                    setIsTestLoading(false);
                  }

                  console.log("✅ Added plain text message:", {
                    isUser,
                    text: text.trim(),
                  });
                }
              }
            } catch (error) {
              console.error("❌ Error processing DataReceived:", error);
            }
          },
        );

        // Register text stream handlers for transcription and chat - same as widget.js
        if (typeof liveKitRoom.registerTextStreamHandler === "function") {
          console.log("📝 Registering text stream handlers...");

          // Transcription stream handler
          liveKitRoom.registerTextStreamHandler(
            "lk.transcription",
            async (reader: any, participantInfo: any) => {
              console.log(
                "🎯 Transcription stream from:",
                participantInfo.identity,
              );
              try {
                const text = await reader.readAll();
                if (text && text.trim()) {
                  const isUser =
                    participantInfo.identity ===
                    liveKitRoom.localParticipant?.identity;
                  const messageKey = `${
                    isUser ? "user" : "ai"
                  }-transcription-${text.trim()}-${Math.floor(
                    Date.now() / 2000,
                  )}`;

                  if (recentMessagesRef.current.has(messageKey)) {
                    console.log(
                      "🚫 Preventing duplicate transcription:",
                      text.trim(),
                    );
                    return;
                  }

                  recentMessagesRef.current.add(messageKey);
                  setTimeout(
                    () => recentMessagesRef.current.delete(messageKey),
                    5000,
                  );

                  setMessages((prev) => [
                    ...prev,
                    {
                      id: `transcription-${Date.now()}-${Math.random()}`,
                      text: text.trim(),
                      isUser,
                      timestamp: new Date(),
                      source: "voice",
                    },
                  ]);

                  // Stop loading if this is an agent response
                  if (!isUser) {
                    setIsTestLoading(false);
                  }

                  console.log("✅ Transcription added:", {
                    isUser,
                    text: text.trim(),
                  });
                }
              } catch (error) {
                console.error("❌ Error processing transcription:", error);
              }
            },
          );

          // Chat stream handler
          liveKitRoom.registerTextStreamHandler(
            "lk.chat",
            async (reader: any, participantInfo: any) => {
              console.log("💬 Chat stream from:", participantInfo.identity);
              try {
                const text = await reader.readAll();
                const isUser =
                  participantInfo.identity ===
                  liveKitRoom.localParticipant?.identity;

                if (!isUser && text && text.trim()) {
                  const messageKey = `ai-chat-${text.trim()}-${Math.floor(
                    Date.now() / 2000,
                  )}`;

                  if (recentMessagesRef.current.has(messageKey)) {
                    console.log("🚫 Preventing duplicate chat:", text.trim());
                    return;
                  }

                  recentMessagesRef.current.add(messageKey);
                  setTimeout(
                    () => recentMessagesRef.current.delete(messageKey),
                    5000,
                  );

                  setMessages((prev) => [
                    ...prev,
                    {
                      id: `chat-${Date.now()}-${Math.random()}`,
                      text: text.trim(),
                      isUser: false,
                      timestamp: new Date(),
                      source: "chat",
                    },
                  ]);

                  // Stop loading since this is an agent chat response
                  setIsTestLoading(false);

                  console.log("✅ Chat message added:", { text: text.trim() });
                }
              } catch (error) {
                console.error("❌ Error processing chat:", error);
              }
            },
          );
        }

        // Handle transcript from metadata - enhanced with loading state management
        liveKitRoom.on(
          LiveKit.RoomEvent.ParticipantMetadataChanged,
          (metadata: string, participant: any) => {
            if (metadata) {
              try {
                const data = JSON.parse(metadata);
                if (data.transcript || data.text) {
                  const isUser =
                    participant?.identity ===
                    liveKitRoom.localParticipant?.identity;

                  setMessages((prev) => [
                    ...prev,
                    {
                      id: `metadata-${Date.now()}`,
                      text: data.transcript || data.text,
                      isUser,
                      timestamp: new Date(),
                      source: "voice",
                    },
                  ]);

                  // Stop loading if this is an agent response
                  if (!isUser) {
                    setIsTestLoading(false);
                  }

                  console.log(
                    "✅ Transcript from participant metadata:",
                    data.transcript || data.text,
                  );
                }
              } catch (e) {
                console.log("Metadata not JSON:", metadata);
              }
            }
          },
        );

        // Handle room metadata - enhanced with loading state management
        liveKitRoom.on(
          LiveKit.RoomEvent.RoomMetadataChanged,
          (metadata: string) => {
            if (metadata) {
              try {
                const data = JSON.parse(metadata);
                if (data.transcript || data.text) {
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: `room-metadata-${Date.now()}`,
                      text: data.transcript || data.text,
                      isUser: false, // Room metadata is typically from agent
                      timestamp: new Date(),
                      source: "voice",
                    },
                  ]);

                  // Stop loading since this is an agent response
                  setIsTestLoading(false);

                  console.log(
                    "✅ Transcript from room metadata:",
                    data.transcript || data.text,
                  );
                }
              } catch (e) {
                console.log("Room metadata not JSON:", metadata);
              }
            }
          },
        );

        // Handle connection - same as working component
        liveKitRoom.on(LiveKit.RoomEvent.Connected, async () => {
          console.log("🎉 Connected to LiveKit room for agent testing");
          setIsConnected(true);
          setIsConnecting(false);
          setIsCallActive(true);
          setConnectionStatus("connected");
          setTestStatus("🟢 Connected! You can now speak with the agent.");
          setStatusMessage("✅ Connected - Speak now!");

          // Start call timer
          const timer = setInterval(() => {
            setCallDuration((prev) => prev + 1);
          }, 1000);
          setCallTimerInterval(timer);

          // Enable microphone with same settings as working component
          try {
            await liveKitRoom.localParticipant.setMicrophoneEnabled(true, {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            });

            setIsRecording(true);

            console.log("🎤 Microphone enabled and ready");
          } catch (err) {
            console.error("Failed to enable microphone:", err);
          }
        });

        // Handle disconnection
        liveKitRoom.on(LiveKit.RoomEvent.Disconnected, () => {
          console.log("❌ Disconnected from LiveKit room");
          setIsConnected(false);
          setIsConnecting(false);
          setIsCallActive(false);
          setConnectionStatus("disconnected");
          setTestStatus("🔴 Disconnected");
          setStatusMessage("❌ Disconnected");
          setRoom(null);

          if (callTimerInterval) {
            clearInterval(callTimerInterval);
            setCallTimerInterval(null);
          }
          setCallDuration(0);
        });

        // Connect to room using token data
        console.log("🔗 Connecting to LiveKit room...");
        await liveKitRoom.connect(tokenData.url, tokenData.token);
        setRoom(liveKitRoom);
      } catch (error) {
        console.error("LiveKit connection failed:", error);
        setTestStatus(
          `❌ Connection failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        );
        setConnectionStatus("disconnected");
        setStatusMessage("Connection failed");
        setIsConnecting(false);
        setIsConnected(false);
      }
    },
    [currentAgent, callTimerInterval],
  );

  const endAgentCall = useCallback(async () => {
    if (room) {
      try {
        await room.disconnect();
        console.log("✅ Disconnected from LiveKit room");
      } catch (error) {
        console.error("Error disconnecting from room:", error);
      }
    }

    setIsConnected(false);
    setIsConnecting(false);
    setIsCallActive(false);
    setConnectionStatus("disconnected");
    setTestStatus("📞 Call ended");
    setStatusMessage("Ready to connect");
    setRoom(null);
    setIsRecording(false);

    if (callTimerInterval) {
      clearInterval(callTimerInterval);
      setCallTimerInterval(null);
    }
    setCallDuration(0);

    // Add disconnect message
    setMessages((prev) => [
      ...prev,
      {
        id: `disconnect-${Date.now()}`,
        text: "Call ended",
        isUser: false,
        timestamp: new Date(),
        source: "system",
      },
    ]);
  }, [room, callTimerInterval]);

  const toggleMute = useCallback(async () => {
    if (room && isConnected) {
      try {
        const newMutedState = !isMuted;
        await room.localParticipant.setMicrophoneEnabled(!newMutedState);
        setIsMuted(newMutedState);
        setIsRecording(!newMutedState);
        console.log(`🎤 Microphone ${newMutedState ? "muted" : "unmuted"}`);
      } catch (error) {
        console.error("Error toggling mute:", error);
      }
    }
  }, [room, isConnected, isMuted]);

  // Test connection function to help debug issues
  const testConnection = useCallback(async () => {
    if (!currentAgent) {
      alert("No agent selected");
      return;
    }

    console.log("🧪 Testing connection components...");

    try {
      // Test 1: Check microphone permission
      console.log("🎤 Testing microphone access...");
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("✅ Microphone access OK");

      // Test 2: Check token server
      console.log("🔑 Testing token server...");
      const response = await fetch(
        "https://python.service.callshivai.com/token",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agent_id: currentAgent.id,
            language: "en-US",
            call_id: `test_${Date.now()}`,
            device: "desktop",
            user_agent: navigator.userAgent,
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Token server OK", data);
        alert(
          "✅ Connection test passed! Token server is working. Try starting the call again.",
        );
      } else {
        console.error("❌ Token server error:", response.status);
        alert(
          `❌ Token server error: ${response.status}. The voice service may be temporarily unavailable.`,
        );
      }
    } catch (error) {
      console.error("❌ Connection test failed:", error);
      if (error instanceof Error && error.name === "NotAllowedError") {
        alert(
          "❌ Microphone permission denied. Please allow microphone access and try again.",
        );
      } else if (error instanceof Error && error.message.includes("fetch")) {
        alert(
          "❌ Cannot reach voice service. Please check your internet connection.",
        );
      } else {
        alert(
          `❌ Connection test failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        );
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
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Debounce search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch agents with filters from API
  const fetchFilteredAgents = useCallback(async () => {
    if (!isDeveloper) {
      setFilteredAgents([]);
      setTotalAgents(0);
      setTotalPages(0);
      return;
    }

    setIsLoadingAgents(true);
    try {
      const result = await agentAPI.getAgentsWithFilters({
        gender: genderFilter,
        sort: sortBy,
        search: debouncedSearchTerm || undefined,
        page: currentPage,
        limit: AGENTS_PER_PAGE,
      });

      setFilteredAgents(result.agents);
      setTotalAgents(result.total);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error("Error fetching filtered agents:", error);
      // Fallback to client-side filtering if API fails
      const fallbackFiltered = agentsRef.current
        .filter((agent) => {
          const matchesSearch = agent.name
            .toLowerCase()
            .includes((debouncedSearchTerm || "").toLowerCase());
          const agentGender = ((agent as any).gender || "").toLowerCase();
          const matchesGender =
            genderFilter === "all" ||
            agentGender === genderFilter.toLowerCase();
          return matchesSearch && matchesGender;
        })
        .sort((a, b) => {
          switch (sortBy) {
            case "a-z":
              return a.name.localeCompare(b.name);
            case "z-a":
              return b.name.localeCompare(a.name);
            case "newest":
              return (
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
              );
            case "oldest":
              return (
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime()
              );
            default:
              return 0;
          }
        });

      const total = fallbackFiltered.length;
      const totalPagesCalc = Math.ceil(total / AGENTS_PER_PAGE);
      const startIndex = (currentPage - 1) * AGENTS_PER_PAGE;
      const paginatedFallback = fallbackFiltered.slice(
        startIndex,
        startIndex + AGENTS_PER_PAGE,
      );

      setFilteredAgents(paginatedFallback);
      setTotalAgents(total);
      setTotalPages(totalPagesCalc);
    } finally {
      setIsLoadingAgents(false);
    }
  }, [
    isDeveloper,
    genderFilter,
    sortBy,
    debouncedSearchTerm,
    currentPage,
    agentListRefreshToken,
    // NOTE: `agents` intentionally excluded — adding it would cause fetchFilteredAgents to
    // re-run after every publish/pause and overwrite the optimistic UI update with stale
    // filter-API data. agentsRef.current is used in the catch fallback instead.
  ]);

  // Keep agentsRef in sync with the context agents list (used in fetchFilteredAgents fallback)
  useEffect(() => {
    agentsRef.current = agents;
  }, [agents]);

  // Fetch agents when filters or page changes
  useEffect(() => {
    fetchFilteredAgents();
  }, [fetchFilteredAgents]);

  // Paginated agents are now directly from API response
  const paginatedAgents = filteredAgents;

  // Handle page change
  const handlePageChange = (page: number) => {
    setSearchParams({ page: page.toString() });
    // Scroll to top of the page when page changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage > 1) {
      // Reset to page 1 when search, gender or sort changes
      setSearchParams({ page: "1" });
    }
  }, [debouncedSearchTerm, genderFilter, sortBy]);

  // AGENT VIEW PAGE - Show whenever there's an ID and not on train route
  if (isView) {
    // If currentAgent is not yet loaded, show a loading state
    if (!currentAgent) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Bot className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4 animate-pulse" />
            <p className="text-slate-600 dark:text-slate-400">Loading agent...</p>
          </div>
        </div>
      );
    }

    return (
      <AgentViewPage
        currentAgent={currentAgent}
        publishingAgents={publishingAgents}
        showQRModal={showQRModal}
        setShowQRModal={setShowQRModal}
        openAgentTestPage={openAgentTestPage}
        handlePublish={handlePublish}
        showPublishConfirm={showPublishConfirm}
        handlePublishCancel={handlePublishCancel}
        handlePublishConfirm={handlePublishConfirm}
        isPublishing={isPublishing}
        handlePause={handlePause}
        showPauseConfirm={showPauseConfirm}
        handlePauseCancel={handlePauseCancel}
        handlePauseConfirm={handlePauseConfirm}
        isPausing={isPausing}
        showDeleteConfirm={showDeleteConfirm}
        handleDeleteCancel={handleDeleteCancel}
        handleDeleteConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
        showTestChat={showTestChat}
        setShowTestChat={setShowTestChat}
        room={room}
        setIsCallActive={setIsCallActive}
        setIsRecording={setIsRecording}
        setConnectionStatus={setConnectionStatus}
        setStatusMessage={setStatusMessage}
        callTimerInterval={callTimerInterval}
        setCallTimerInterval={setCallTimerInterval}
        setCallDuration={setCallDuration}
        activeTestTab={activeTestTab}
        setActiveTestTab={setActiveTestTab}
        connectionStatus={connectionStatus}
        statusMessage={statusMessage}
        isCallActive={isCallActive}
        callDuration={callDuration}
        formatCallDuration={formatCallDuration}
        handleStartCall={handleStartCall}
        isTestLoading={isTestLoading}
        isConnecting={isConnecting}
        handleToggleMute={handleToggleMute}
        isMuted={isMuted}
        handleEndCall={handleEndCall}
        testConnection={testConnection}
        messages={messages}
        testInput={testInput}
        setTestInput={setTestInput}
        handleTestSend={handleTestSend}
      />
    );
  }

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
                {isDeveloper ? totalAgents : 0}
              </p>
              <p className="text-[10px] lg:text-sm font-medium text-slate-600 dark:text-slate-400">
                Total
              </p>
            </div>
            <div className="bg-white/50 flex items-center justify-center gap-1.5 dark:bg-slate-800/50 rounded-lg px-2 lg:px-6 py-2 lg:py-2 text-center shadow-sm transition-all duration-200 hover:shadow-md">
              <p className="text-base lg:text-2xl font-bold text-green-600 dark:text-green-400">
                {isDeveloper
                  ? agents.filter(
                      (a) => a.status === "Published" || (a as any).is_active,
                    ).length
                  : 0}
              </p>
              <p className="text-[10px] lg:text-sm font-medium text-slate-600 dark:text-slate-400">
                Live
              </p>
            </div>
            <div className="bg-white/50 flex items-center justify-center gap-1.5 dark:bg-slate-800/50 rounded-lg px-2 lg:px-6 py-2 lg:py-2 text-center shadow-sm transition-all duration-200 hover:shadow-md">
              <p className="text-base lg:text-2xl font-bold text-orange-600 dark:text-orange-400">
                {isDeveloper
                  ? agents.filter(
                      (a) => a.status !== "Published" && !(a as any).is_active,
                    ).length
                  : 0}
              </p>
              <p className="text-[10px] lg:text-sm font-medium text-slate-600 dark:text-slate-400">
                Unpublished
              </p>
            </div>
          </div>

          {/* Create Button */}
          <button
            onClick={() => {
              if (!isDeveloper || (isCreatingAgent && isModalMinimized)) return;
              setShowQuickCreateModal(true);
            }}
            disabled={!isDeveloper || (isCreatingAgent && isModalMinimized)}
            title={isCreatingAgent && isModalMinimized ? 'Knowledge base training in progress…' : undefined}
            className={`relative overflow-hidden flex items-center justify-center gap-2 px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl transition-all duration-200 shadow-sm whitespace-nowrap ${
              isDeveloper && !(isCreatingAgent && isModalMinimized)
                ? "common-button-bg transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                : "bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-300 cursor-not-allowed opacity-50"
            }`}
          >
            {/* Tailwind shine effect (requires keyframes in tailwind.config.js) */}
            {isDeveloper && (
              <span
                aria-hidden="true"
                className="absolute left-0 top-0 h-full w-full pointer-events-none z-0"
              >
                <span className="block absolute left-[-60%] top-0 h-full w-1/2 bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-70 blur-sm animate-shine" />
              </span>
            )}
            <Plus className="w-4 h-4 lg:w-5 lg:h-5 z-10" />
            <span className="text-sm lg:text-base font-medium z-10">
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

              {/* Gender Filter */}
              <div className="hidden lg:block min-w-[140px]">
                <SearchableSelect
                  options={[
                    { value: "all", label: "All Gender" },
                    { value: "male", label: "Male" },
                    { value: "female", label: "Female" },
                  ]}
                  value={genderFilter}
                  onChange={(value) => setGenderFilter(value)}
                  placeholder="Filter by gender..."
                />
              </div>

              {/* Sort By */}
              <div className="hidden lg:block min-w-[140px]">
                <SearchableSelect
                  options={[
                    { value: "newest", label: "Newest" },
                    { value: "oldest", label: "Oldest" },
                    { value: "a-z", label: "A to Z" },
                    { value: "z-a", label: "Z to A" },
                  ]}
                  value={sortBy}
                  onChange={(value) => setSortBy(value)}
                  placeholder="Sort by..."
                />
              </div>

              {/* Filter Button - Mobile Only */}
              <button
                onClick={() => setShowMobileFilters(true)}
                className="lg:hidden flex items-center justify-center common-button-bg2 p-2.5 rounded-lg active:scale-95 relative"
              >
                <Filter className="w-4 h-4" />
                {(genderFilter !== "all" || sortBy !== "newest") && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
                )}
              </button>
            </div>

            {/* Active Filters Display */}
            {(searchTerm || genderFilter !== "all" || sortBy !== "newest") && (
              <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Active filters:
                </span>
                {searchTerm && (
                  <span className="px-2 py-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-full text-xs flex items-center gap-1">
                    "{searchTerm}"
                    <button
                      onClick={() => setSearchTerm("")}
                      className="hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full p-0.5"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {genderFilter !== "all" && (
                  <span className="px-2 py-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-full text-xs flex items-center gap-1">
                    Gender: {genderFilter}
                    <button
                      onClick={() => setGenderFilter("all")}
                      className="hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full p-0.5"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {sortBy !== "newest" && (
                  <span className="px-2 py-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-full text-xs flex items-center gap-1">
                    Sort:{" "}
                    {sortBy === "a-z"
                      ? "A to Z"
                      : sortBy === "z-a"
                        ? "Z to A"
                        : sortBy === "oldest"
                          ? "Oldest"
                          : sortBy}
                    <button
                      onClick={() => setSortBy("newest")}
                      className="hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full p-0.5"
                    >
                      ✕
                    </button>
                  </span>
                )}
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setGenderFilter("all");
                    setSortBy("newest");
                  }}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 underline"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Loading State */}
        {isLoadingAgents && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {[...Array(AGENTS_PER_PAGE)].map((_, index) => (
              <GlassCard key={index}>
                <div className="p-4 sm:p-5 lg:p-6 animate-pulse">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 sm:w-12 h-10 sm:h-12 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded flex-1"></div>
                    <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-10"></div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}

        {/* Mobile-First Agent Grid */}
        {!isLoadingAgents && paginatedAgents.length > 0 && (
          <>
            {console.log('🎨 [Render] Rendering', paginatedAgents.length, 'agents')}
            {console.log('🎨 [Render] Paginated agent IDs:', paginatedAgents.map(a => a.id))}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {paginatedAgents.map((agent) => {
              return (
              <GlassCard key={agent.id} hover>
                <div className="p-4 sm:p-5 lg:p-6 relative">
                  {/* KB Processing Overlay — shown when modal is minimized */}
                  {creatingAgentId && agent.id === creatingAgentId && isCreatingAgent && isModalMinimized && (
                    <div
                      className="absolute inset-0 z-10 rounded-xl sm:rounded-2xl bg-blue-50/95 dark:bg-slate-900/95 flex flex-col items-center justify-center gap-3 cursor-pointer"
                      onClick={() => {
                        setIsModalMinimized(false);
                        setShowQuickCreateModal(true);
                      }}
                    >
                      <div className="w-10 h-10 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <div className="text-center px-4">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">
                          Training Knowledge Base
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Click to view progress
                        </p>
                      </div>
                      {kbCreationProgress?.progress !== undefined && (
                        <div className="w-32 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${kbCreationProgress.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )}
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
                            {formatAgentLanguages((agent as any).language)} • {agent.persona}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                            agent.status === "Published" ||
                            (agent as any).is_active
                              ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                              : "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
                          }`}
                        >
                          {agent.status === "Published" ||
                          (agent as any).is_active
                            ? "Live"
                            : "Unpublished"}
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
                        {(agent as any).multilingual_voice && Array.isArray((agent as any).language) && (agent as any).language.includes("multilingual") && (
                          <span className="ml-1.5 text-xs text-purple-600 dark:text-purple-400 font-medium">
                            · Multilingual: {(agent as any).multilingual_voice}
                          </span>
                        )}
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
                            ? "opacity-50 cursor-not-allowed"
                            : "active:scale-[0.98]"
                        }`}
                      >
                        {publishingAgents.has(agent.id) ? (
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                        ) : (
                          <Pause className="w-4 h-4" />
                        )}
                        {publishingAgents.has(agent.id)
                          ? "Pausing..."
                          : "Pause"}
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          (agent as any).is_active
                            ? handlePause(agent.id)
                            : handlePublish(agent.id)
                        }
                        disabled={publishingAgents.has(agent.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 transition-all duration-200 text-sm font-medium ${
                          publishingAgents.has(agent.id)
                            ? "opacity-50 cursor-not-allowed"
                            : "active:scale-[0.98]"
                        } ${
                          (agent as any).is_active
                            ? "common-button-bg2"
                            : "common-button-bg"
                        }`}
                      >
                        {publishingAgents.has(agent.id) ? (
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                        ) : (agent as any).is_active ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                        {publishingAgents.has(agent.id)
                          ? (agent as any).is_active
                            ? "Pausing..."
                            : "Publishing..."
                          : (agent as any).is_active
                            ? "Pause"
                            : "Publish"}
                      </button>
                    )}

                    {(agent.status === "Published" || (agent as any).is_active) && (
                    <button
                      onClick={() => {
                        setCurrentAgent(agent);
                        setShowQRModal(true);
                      }}
                      className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95"
                      title="Show QR code"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                    )}

                    <button
                      onClick={() => handleDeleteClick(agent.id)}
                      className="p-2.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-95"
                      title="Delete agent"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </GlassCard>
              );
            })}
          </div>
          </>
        )}

        {/* Pagination */}
        {totalAgents > 0 && (
          <div className="mt-4 lg:mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalAgents}
              itemsPerPage={AGENTS_PER_PAGE}
              onPageChange={handlePageChange}
            />
          </div>
        )}

        {/* Mobile-Optimized Empty State */}
        {filteredAgents.length === 0 && !isLoadingAgents && (
          <div className="text-center py-12 lg:py-16 px-4">
            <Bot className="w-20 lg:w-24 h-20 lg:h-24 text-slate-300 dark:text-slate-600 mx-auto mb-6" />
            <h3 className="text-xl lg:text-2xl font-medium text-slate-600 dark:text-slate-400 mb-3">
              {searchTerm || genderFilter !== "all"
                ? "No agents found"
                : "No agents created yet"}
            </h3>
            <p className="text-sm lg:text-base text-slate-500 dark:text-slate-500 max-w-md lg:max-w-lg mx-auto mb-6 leading-relaxed">
              {searchTerm || genderFilter !== "all"
                ? "Try adjusting your search or filter criteria to find what you're looking for"
                : "Create your first AI agent to get started with automated conversations and boost your business efficiency"}
            </p>
            {!searchTerm && genderFilter === "all" && isDeveloper && (
              <div className="space-y-3">
                <button
                  onClick={() => setShowQuickCreateModal(true)}
                  className="w-full sm:w-auto common-button-bg px-6 py-3 rounded-xl shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Create your first AI Employee
                </button>
                <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500">
                  Get started in just 2 minutes ⚡
                </p>
              </div>
            )}
            {(searchTerm || genderFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setGenderFilter("all");
                }}
                className="w-full sm:w-auto common-button-bg2 px-6 py-2.5 rounded-lg"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* QR Modal */}
        {showQRModal && currentAgent && (
          <AgentQRModal
            agent={currentAgent}
            onClose={() => setShowQRModal(false)}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm &&
          createPortal(
            <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-700">
                <div className="p-6">
                  <div className="flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full mx-auto mb-4">
                    <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 dark:text-white text-center mb-2">
                    Delete Agent?
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-6">
                    Are you sure you want to delete this agent? This action cannot
                    be undone and all associated data will be permanently removed.
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleDeleteCancel}
                      disabled={isDeleting}
                      className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteConfirm}
                      disabled={isDeleting}
                      className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isDeleting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          <span>Deleting...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )}

        {/* Publish Confirmation Modal */}
        {showPublishConfirm &&
          createPortal(
            <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-700">
                <div className="p-6">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full mx-auto mb-4">
                    <UploadCloud className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 dark:text-white text-center mb-2">
                    Publish Agent?
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-6">
                    Are you sure you want to publish this agent? It will become available to users.
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handlePublishCancel}
                      disabled={isPublishing}
                      className="flex-1 h-11 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePublishConfirm}
                      disabled={isPublishing}
                      className="flex-1 h-11 px-4 rounded-xl transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 common-button-bg"
                    >
                      {isPublishing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          <span>Publishing...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-4 h-4" />
                          <span>Publish</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )}

        {/* Pause Confirmation Modal */}
        {showPauseConfirm &&
          createPortal(
            <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-700">
                <div className="p-6">
                  <div className="flex items-center justify-center w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-full mx-auto mb-4">
                    <PauseCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 dark:text-white text-center mb-2">
                    Pause Agent?
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-6">
                    Are you sure you want to pause this agent? It will no longer be available to users.
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handlePauseCancel}
                      disabled={isPausing}
                      className="flex-1 h-11 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePauseConfirm}
                      disabled={isPausing}
                      className="flex-1 h-11 px-4 rounded-xl transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 common-button-bg2"
                    >
                      {isPausing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-400 dark:border-slate-300 border-t-slate-700 dark:border-t-slate-100"></div>
                          <span>Pausing...</span>
                        </>
                      ) : (
                        <>
                          <PauseCircle className="w-4 h-4" />
                          <span>Pause</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )}

        {/* Integration Code Modal */}
        {showIntegrationCodeModal && agentForIntegration &&
          createPortal(
            <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-2 sm:p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-xl border border-slate-200 dark:border-slate-700 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
                <div className="p-4 sm:p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-white">
                      Widget Integration Code
                    </h3>
                    <button
                      onClick={() => {
                        setShowIntegrationCodeModal(false);
                        setAgentForIntegration(null);
                      }}
                      className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                    Copy and paste this script tag into your website's HTML. The widget will automatically load your saved customizations.
                  </p>

                  {/* Code Block */}
                  <div className="mb-6">
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
                      {(() => {
                        const agentObj = agents.find((a: any) => a.id === agentForIntegration);
                        const agentLang = agentObj?.language || '';
                        const embedUrl = `https://www.callshivai.com/widget2.js?agentId=${agentForIntegration}&userId=${user?.id || ''}${agentLang ? `&language=${agentLang}` : ''}`;
                        const embedCode = `<script src="${embedUrl}"><\/script>`;
                        return (
                          <>
                      <code className="common-bg-icons block w-full p-4 rounded-lg text-xs sm:text-sm font-mono text-slate-800 dark:text-white overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {embedCode}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(embedCode);
                          appToast.success("Code copied to clipboard!", { duration: 2000 });
                        }}
                        className="absolute top-3 right-3 p-2 common-button-bg rounded-lg hover:shadow-sm transition-all min-h-[36px] min-w-[36px] flex items-center justify-center"
                      >
                        <Copy className="w-4 h-4 text-white" />
                      </button>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Installation Instructions */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                      📋 Quick Installation:
                    </h4>
                    <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-2 list-decimal list-inside">
                      <li>Copy the script tag above</li>
                      <li>Paste it in your website's HTML, before the closing &lt;/body&gt; tag</li>
                      <li>The widget will load automatically with all your custom settings</li>
                      <li>To update: copy new script when you change settings</li>
                    </ol>
                  </div>

                  {/* Close Button */}
                  <div className="mt-6 flex items-center justify-end">
                    <button
                      onClick={() => {
                        setShowIntegrationCodeModal(false);
                        setAgentForIntegration(null);
                      }}
                      className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 font-medium"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )}

        {showMobileFilters &&
          createPortal(
            <div className="lg:hidden">
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black/50 z-[50]"
                onClick={() => setShowMobileFilters(false)}
              />
              {/* Bottom Sheet */}
              <div className="fixed inset-x-0 bottom-0 z-[51] animate-slide-up">
                <div className="bg-white dark:bg-slate-800 rounded-t-3xl shadow-2xl max-h-[85vh] overflow-hidden">
                  {/* Handle Bar */}
                  <div className="flex justify-center pt-3 pb-2">
                    <div className="w-10 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
                  </div>

                  {/* Header */}
                  <div className="flex items-center justify-between px-5 pb-4 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                      Filters & Sort
                    </h3>
                    <button
                      onClick={() => setShowMobileFilters(false)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5 text-slate-500" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="px-5 py-4 space-y-5 overflow-y-auto max-h-[50vh]">
                    {/* Gender Filter */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Gender
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: "all", label: "All" },
                          { value: "male", label: "Male" },
                          { value: "female", label: "Female" },
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setGenderFilter(option.value)}
                            className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                              genderFilter === option.value
                                ? "bg-blue-500 text-white shadow-md"
                                : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sort By */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Sort By
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: "newest", label: "Newest" },
                          { value: "oldest", label: "Oldest" },
                          { value: "a-z", label: "A → Z" },
                          { value: "z-a", label: "Z → A" },
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setSortBy(option.value)}
                            className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                              sortBy === option.value
                                ? "bg-blue-500 text-white shadow-md"
                                : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 pb-safe">
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setGenderFilter("all");
                          setSortBy("newest");
                        }}
                        className="flex-1 py-3 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-300 font-medium active:scale-[0.98] transition-transform"
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => setShowMobileFilters(false)}
                        className="flex-1 py-3 common-button-bg rounded-xl font-medium active:scale-[0.98] transition-transform"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )}

        {/* Quick Create AI Employee Modal */}
        {showQuickCreateModal && !isModalMinimized &&
          createPortal(
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4"
              onTouchMove={(e) => e.target === e.currentTarget && e.preventDefault()}
            >
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/60"
                onTouchMove={(e) => e.preventDefault()}
              />

              {/* Modal */}
              <div
                className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] sm:max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700"
                tabIndex={-1}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-3 sm:p-5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600 dark:text-pink-400" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
                        Create AI Employee
                      </h2>
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                        Step {quickCreateStep} of 7
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {isCreatingAgent && (
                      <button
                        onClick={() => setIsModalMinimized(true)}
                        className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title="Minimize — monitor progress from agent card"
                      >
                        <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
                      </button>
                    )}
                    <button
                      onClick={handleQuickCreateClose}
                      disabled={isCreatingAgent}
                      className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                        isCreatingAgent
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="px-3 sm:px-5 pt-3 sm:pt-4 flex-shrink-0">
                  <div className="flex items-center gap-1 sm:gap-2">
                    {[1, 2, 3, 4, 5, 6, 7].map((step) => (
                      <div key={step} className="flex-1 flex items-center">
                        <div
                          className={`h-1.5 sm:h-2 w-full rounded-full transition-all duration-300 ${
                            step <= quickCreateStep
                              ? "bg-blue-400 dark:bg-blue-500"
                              : "bg-slate-200 dark:bg-slate-700"
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div className="p-3 py-4 sm:p-5 overflow-y-auto flex-1 min-h-0 ">

                  {/* ── KB Creation Progress Screen ────────────────────── */}
                  {isCreatingAgent && (
                    <div className="flex flex-col gap-4 animate-fadeIn">
                      {/* Header */}
                      <div className="text-center">
                        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                          <Bot className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-1">
                          Creating {quickCreateData.aiEmployeeName || 'Your AI Employee'}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {kbCreationProgress?.message || 'Setting up your AI employee...'}
                        </p>
                      </div>

                      {/* Overall progress bar */}
                      <div>
                        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                          <span>
                            {kbCreationProgress?.status === 'completed'
                              ? '✓ Complete'
                              : kbCreationProgress?.status === 'failed'
                              ? '✗ Failed'
                              : 'Overall Progress'}
                          </span>
                          <span className={`font-semibold ${
                            kbCreationProgress?.status === 'completed'
                              ? 'text-green-600 dark:text-green-400'
                              : kbCreationProgress?.status === 'failed'
                              ? 'text-red-500'
                              : 'text-blue-600 dark:text-blue-400'
                          }`}>
                            {kbCreationProgress?.progress ?? 0}%
                          </span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              kbCreationProgress?.status === 'completed'
                                ? 'bg-green-500'
                                : kbCreationProgress?.status === 'failed'
                                ? 'bg-red-500'
                                : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                            }`}
                            style={{ width: `${kbCreationProgress?.progress ?? 0}%` }}
                          />
                        </div>
                      </div>

                      {/* Steps list */}
                      <div className="space-y-2">
                        {[
                          { label: 'Preparing configuration', done: (kbCreationProgress?.progress ?? 0) >= 10 },
                          { label: 'Creating AI employee profile', done: (kbCreationProgress?.progress ?? 0) >= 20 },
                          { label: 'Processing knowledge base', done: kbCreationProgress?.status === 'completed' },
                        ].map((step, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                          >
                            {step.done ? (
                              <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                                <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                              </div>
                            ) : (kbCreationProgress?.progress ?? 0) > (i === 0 ? 0 : i === 1 ? 10 : 20) ? (
                              <div className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                                <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 animate-spin" viewBox="0 0 24 24" fill="none">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                </svg>
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
                            )}
                            <span className={`text-sm ${step.done ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>
                              {step.label}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Per-file KB progress cards */}
                      {kbFileProgress.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            Knowledge Base Files
                          </p>
                          {kbFileProgress.map((file) => {
                            const stageLabel: Record<string, string> = {
                              downloading: '⬇ Downloading...',
                              downloaded: '✓ Downloaded',
                              parsing: '⚙ Parsing document...',
                              uploading: '☁ Uploading...',
                              done: '✓ Done',
                              error: '✗ Error',
                            };
                            const isDoneFile = file.stage === 'done';
                            const isErrorFile = file.stage === 'error';
                            return (
                              <div
                                key={file.file_index}
                                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                                      {file.file_name}
                                    </span>
                                  </div>
                                  <span className={`text-xs font-semibold flex-shrink-0 ml-2 ${
                                    isDoneFile ? 'text-green-600 dark:text-green-400' : isErrorFile ? 'text-red-500' : 'text-blue-600 dark:text-blue-400'
                                  }`}>
                                    {file.file_percent}%
                                  </span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-400 ${
                                      isDoneFile ? 'bg-green-500' : isErrorFile ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-violet-500'
                                    }`}
                                    style={{ width: `${file.file_percent}%` }}
                                  />
                                </div>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                                  {stageLabel[file.stage] || file.stage}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Completion message */}
                      {kbCreationProgress?.status === 'completed' && (
                        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                          <p className="text-sm font-medium text-green-700 dark:text-green-400">
                            {quickCreateData.aiEmployeeName || 'Your AI Employee'} is ready!
                          </p>
                        </div>
                      )}

                      {kbCreationProgress?.status === 'failed' && (
                        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                          <MessageSquare className="w-5 h-5 text-red-500 flex-shrink-0" />
                          <p className="text-sm text-red-600 dark:text-red-400">
                            {kbCreationProgress.message || 'Something went wrong. Please try again.'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  {/* ── End KB Creation Progress Screen ────────────────── */}

                  {/* Step 1: Company Name & AI Employee Name */}
                  {!isCreatingAgent && quickCreateStep === 1 && (
                    <div className="space-y-3 sm:space-y-4 animate-fadeIn">
                      <div className="text-center mb-4 sm:mb-6">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center">
                          <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white mb-1 sm:mb-2">
                          Let's get started!
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto px-2">
                          Enter your company name and give your AI a friendly
                          name. This helps personalize conversations with your
                          customers.
                        </p>
                      </div>

                      {/* Company Name Input */}
                      <div className="space-y-1.5 sm:space-y-2">
                        <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          Company Name
                        </label>
                        <input
                          type="text"
                          value={quickCreateData.companyName}
                          onChange={(e) =>
                            setQuickCreateData((prev) => ({
                              ...prev,
                              companyName: e.target.value,
                            }))
                          }
                          placeholder="e.g., Acme Corporation"
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm sm:text-base text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all"
                        />

                        {/* Primary company name toggle */}
                        <label
                          className={`flex items-start gap-2.5 mt-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-all select-none ${
                            quickCreateData.useCompanyNameForTemplate
                              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700'
                              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <div className="relative flex-shrink-0 mt-0.5">
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={quickCreateData.useCompanyNameForTemplate}
                              onChange={(e) =>
                                setQuickCreateData((prev) => ({
                                  ...prev,
                                  useCompanyNameForTemplate: e.target.checked,
                                }))
                              }
                            />
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center border-2 transition-all ${
                                quickCreateData.useCompanyNameForTemplate
                                  ? 'bg-blue-600 border-blue-600'
                                  : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-500'
                              }`}
                            >
                              {quickCreateData.useCompanyNameForTemplate && (
                                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8">
                                  <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-semibold leading-snug ${
                              quickCreateData.useCompanyNameForTemplate
                                ? 'text-blue-700 dark:text-blue-300'
                                : 'text-slate-600 dark:text-slate-400'
                            }`}>
                              Use as primary company name for AI template
                            </p>
                            <p className={`text-[10px] mt-0.5 leading-snug ${
                              quickCreateData.useCompanyNameForTemplate
                                ? 'text-blue-600/80 dark:text-blue-400/80'
                                : 'text-slate-400 dark:text-slate-500'
                            }`}>
                              {quickCreateData.useCompanyNameForTemplate
                                ? `The AI template will be generated using "${quickCreateData.companyName || 'your company name'}"`
                                : 'Company name will be inferred automatically from your knowledge base'}
                            </p>
                          </div>
                        </label>
                      </div>

                      {/* AI Employee Name Input */}
                      <div className="space-y-1.5 sm:space-y-2">
                        <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          AI Employee Name
                        </label>
                        <input
                          type="text"
                          value={quickCreateData.aiEmployeeName}
                          onChange={(e) =>
                            setQuickCreateData((prev) => ({
                              ...prev,
                              aiEmployeeName: e.target.value,
                            }))
                          }
                          placeholder="e.g., Alex, Sarah, Max"
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm sm:text-base text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all"
                        />
                        <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500">
                          This is how your AI Employee will introduce itself to
                          callers
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Voice Configuration */}
                  {!isCreatingAgent && quickCreateStep === 2 && (
                    <div className="space-y-3 sm:space-y-4 animate-fadeIn">
                      <div className="text-center mb-4 sm:mb-6">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center">
                          <Globe className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white mb-1 sm:mb-2">
                          Voice & Language Settings
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto px-2">
                          Configure how your AI Employee will sound and communicate
                        </p>
                      </div>

                      <div className="space-y-4">
                        {/* Gender Selection */}
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Gender
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { value: 'female', label: 'Female' },
                              { value: 'male', label: 'Male' },
                            ].map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() =>
                                  setQuickCreateData((prev) => {
                                    const newGender = option.value as 'female' | 'male';
                                    const needsMultilingual = prev.languages.some((l) => l !== "multilingual" && !englishOnlyLanguages.includes(l));
                                    // Pick the first multilingual voice if non-English, otherwise first voice
                                    const newVoice = needsMultilingual
                                      ? multilingualVoices[newGender][0]
                                      : (newGender === 'female' ? 'Achernar' : 'Achird');
                                    return {
                                      ...prev,
                                      gender: option.value,
                                      voice: newVoice,
                                    };
                                  })
                                }
                                className={`p-3 sm:p-4 rounded-xl border-2 transition-all flex items-center justify-center ${
                                  quickCreateData.gender === option.value
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                }`}
                              >
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{option.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* ── Multilingual Toggle ── */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                              Multilingual Mode
                            </label>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-semibold">
                              ⭐ Enterprise
                            </span>
                          </div>
                          {!(['demo@callshivai.com', 'atharkatheri@gmail.com'].includes((user?.email || '').toLowerCase())) && (
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-2">
                              Contact support to enable Multilingual Mode for your account.
                            </p>
                          )}
                          <div className={`rounded-xl border-2 transition-all overflow-hidden ${
                            !(['demo@callshivai.com', 'atharkatheri@gmail.com'].includes((user?.email || '').toLowerCase()))
                              ? "opacity-50 cursor-not-allowed"
                              : quickCreateData.languages.includes("multilingual")
                              ? "border-purple-500"
                              : "border-slate-200 dark:border-slate-700"
                          }`}>
                            <button
                              type="button"
                              disabled={!(['demo@callshivai.com', 'atharkatheri@gmail.com'].includes((user?.email || '').toLowerCase()))}
                              onClick={() => {
                                if (!(['demo@callshivai.com', 'atharkatheri@gmail.com'].includes((user?.email || '').toLowerCase()))) return;
                                const isOn = quickCreateData.languages.includes("multilingual");
                                setQuickCreateData((prev) => ({
                                  ...prev,
                                  languages: isOn
                                    ? prev.languages.filter((l) => l !== "multilingual")
                                    : [...prev.languages, "multilingual"],
                                }));
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
                                quickCreateData.languages.includes("multilingual")
                                  ? "bg-purple-50 dark:bg-purple-900/20"
                                  : "bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                              }`}
                            >
                              <span className="text-2xl flex-shrink-0">🌐</span>
                              <div className="flex-1 min-w-0">
                                <div className={`text-sm font-semibold ${
                                  quickCreateData.languages.includes("multilingual")
                                    ? "text-purple-700 dark:text-purple-300"
                                    : "text-slate-700 dark:text-slate-200"
                                }`}>Enable Multilingual</div>
                                <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Auto-detect &amp; respond in any language</div>
                              </div>
                              <div className={`w-10 h-5 rounded-full flex-shrink-0 transition-colors relative ${
                                quickCreateData.languages.includes("multilingual")
                                  ? "bg-purple-500"
                                  : "bg-slate-300 dark:bg-slate-600"
                              }`}>
                                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                                  quickCreateData.languages.includes("multilingual") ? "translate-x-5" : "translate-x-0.5"
                                }`} />
                              </div>
                            </button>
                            {isMultilingualMode && (
                              <div className="flex items-center gap-3 px-4 py-2.5 border-t border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900">
                                <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">Voice</span>
                                <select
                                  value={quickCreateData.realtimeVoice}
                                  onChange={(e) =>
                                    setQuickCreateData((prev) => ({
                                      ...prev,
                                      realtimeVoice: e.target.value,
                                    }))
                                  }
                                  className="flex-1 py-1 bg-transparent text-sm text-slate-800 dark:text-white focus:outline-none"
                                  onFocus={() => setRealtimeVoiceSelectOpen(true)}
                                  onBlur={() => setRealtimeVoiceSelectOpen(false)}
                                >
                                  {realtimeTTSVoices[quickCreateData.gender as 'female' | 'male'].map(v => (
                                    <option key={v.value} value={v.value}>{v.label}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* ── Country Selection ── */}
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Target Countries
                            <span className="ml-1 text-[10px] text-slate-400 dark:text-slate-500 font-normal">(filters languages below)</span>
                          </label>

                          <div className="relative" ref={countryDropdownRef}>
                            {/* Backdrop */}
                            {countryDropdownOpen && (
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => { setCountryDropdownOpen(false); setCountrySearch(""); }}
                                aria-hidden="true"
                              />
                            )}

                            {/* Trigger */}
                            <button
                              type="button"
                              onClick={() => { setCountryDropdownOpen((p) => !p); setCountrySearch(""); }}
                              className="w-full px-3 sm:px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-left text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all flex items-center justify-between gap-2 min-h-[46px]"
                            >
                              <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                                {quickCreateData.countries.length === 0 ? (
                                  <span className="text-slate-400 dark:text-slate-500 text-sm">Select countries...</span>
                                ) : (
                                  <>
                                    {quickCreateData.countries.slice(0, 4).map((code) => {
                                      const c = ALL_COUNTRIES.find((x) => x.code === code);
                                      return (
                                        <span key={code} className="inline-flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs rounded-full px-2 py-0.5">
                                          <span>{c?.flag}</span>
                                          <span className="truncate max-w-[70px]">{c?.name}</span>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const newCountries = quickCreateData.countries.filter((x) => x !== code);
                                              // Remove languages that no longer belong to any selected country
                                              const newLangs = newCountries.length === 0
                                                ? quickCreateData.languages
                                                : quickCreateData.languages.filter((lang) => {
                                                    if (lang === "multilingual") return true;
                                                    const lo = ALL_LANGUAGES.find((l) => l.value === lang);
                                                    return lo?.countryCodes.some((cc) => newCountries.includes(cc));
                                                  });
                                              setQuickCreateData((prev) => ({ ...prev, countries: newCountries, languages: newLangs }));
                                            }}
                                            className="ml-0.5 hover:text-indigo-900 dark:hover:text-indigo-100 leading-none"
                                            aria-label={`Remove ${c?.name}`}
                                          >×</button>
                                        </span>
                                      );
                                    })}
                                    {quickCreateData.countries.length > 4 && (
                                      <span className="inline-flex items-center bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-full px-2 py-0.5">
                                        +{quickCreateData.countries.length - 4} more
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                              <ChevronDown className={`w-4 h-4 flex-shrink-0 text-slate-400 transition-transform ${countryDropdownOpen ? "rotate-180" : ""}`} />
                            </button>

                            {/* Panel */}
                            {countryDropdownOpen && (
                              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
                                <div className="p-2 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
                                  <div className="relative flex-1">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                    <input
                                      type="text" value={countrySearch}
                                      onChange={(e) => setCountrySearch(e.target.value)}
                                      placeholder="Search countries..."
                                      className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => { setCountryDropdownOpen(false); setCountrySearch(""); }}
                                    className="flex-shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                    aria-label="Close country dropdown"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                                <div className="overflow-y-auto max-h-52">
                                  {ALL_COUNTRIES.filter((c) => {
                                    const q = countrySearch.toLowerCase();
                                    return !q || c.name.toLowerCase().includes(q);
                                  }).map((country) => {
                                    const isSelected = quickCreateData.countries.includes(country.code);
                                    return (
                                      <button
                                        key={country.code}
                                        type="button"
                                        onClick={() => {
                                          const newCountries = isSelected
                                            ? quickCreateData.countries.filter((x) => x !== country.code)
                                            : [...quickCreateData.countries, country.code];
                                          // When deselecting, strip languages that no longer have any country match
                                          const newLangs = newCountries.length === 0
                                            ? quickCreateData.languages
                                            : quickCreateData.languages.filter((lang) => {
                                                if (lang === "multilingual") return true;
                                                const lo = ALL_LANGUAGES.find((l) => l.value === lang);
                                                return lo?.countryCodes.some((cc) => newCountries.includes(cc));
                                              });
                                          // Auto-adjust voice for multilingual need
                                          const needsMulti = newLangs.some((l) => !englishOnlyLanguages.includes(l) && l !== "multilingual");
                                          const gender = quickCreateData.gender as "female" | "male";
                                          let newVoice = quickCreateData.voice;
                                          if (needsMulti && !multilingualVoices[gender].includes(newVoice)) {
                                            newVoice = multilingualVoices[gender][0];
                                          }
                                          setQuickCreateData((prev) => ({ ...prev, countries: newCountries, languages: newLangs, voice: newVoice }));
                                        }}
                                        className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                                          isSelected
                                            ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300"
                                            : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                        }`}
                                      >
                                        <span className="text-base w-6 flex-shrink-0 text-center">{country.flag}</span>
                                        <span className="flex-1 text-xs font-medium">{country.name}</span>
                                        {isSelected && <CheckCircle className="w-4 h-4 flex-shrink-0 text-indigo-500" />}
                                      </button>
                                    );
                                  })}
                                  {ALL_COUNTRIES.filter((c) => {
                                    const q = countrySearch.toLowerCase();
                                    return !q || c.name.toLowerCase().includes(q);
                                  }).length === 0 && (
                                    <div className="px-4 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                                      No countries found for "{countrySearch}"
                                    </div>
                                  )}
                                </div>
                                {quickCreateData.countries.length > 0 && (
                                  <div className="p-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                    <span className="text-xs text-slate-500 dark:text-slate-400">{quickCreateData.countries.length} selected</span>
                                    <button
                                      type="button"
                                      onClick={() => setQuickCreateData((prev) => ({ ...prev, countries: [], languages: prev.languages.filter((l) => l === "multilingual") }))}
                                      className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                                    >Clear all</button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* ── Language Selection ── */}
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Language <span className="text-red-500">*</span>
                            {quickCreateData.countries.length > 0 && !quickCreateData.languages.includes("multilingual") && (
                              <span className="ml-1 text-[10px] text-blue-500 dark:text-blue-400 font-normal">
                                — showing languages for selected countries
                              </span>
                            )}
                          </label>

                          {/* Multi-select language dropdown */}
                          <div className="relative" ref={langDropdownRef}>
                            {/* Backdrop to close on outside click */}
                            {langDropdownOpen && (
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => {
                                  setLangDropdownOpen(false);
                                  setLangSearch("");
                                }}
                                aria-hidden="true"
                              />
                            )}

                            {/* Trigger button */}
                            <button
                              type="button"
                              onClick={() => {
                                setLangDropdownOpen((prev) => !prev);
                                setLangSearch("");
                              }}
                              className="w-full px-3 sm:px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-left text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all flex items-center justify-between gap-2 min-h-[46px]"
                            >
                              <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                                {quickCreateData.languages.filter((l) => l !== "multilingual").length === 0 ? (
                                  <span className="text-slate-400 dark:text-slate-500 text-sm">
                                    Select languages...
                                  </span>
                                ) : (
                                  <>
                                    {quickCreateData.languages.filter((l) => l !== "multilingual").slice(0, 3).map((langVal) => {
                                      const langObj = ALL_LANGUAGES.find((l) => l.value === langVal);
                                      return (
                                        <span
                                          key={langVal}
                                          className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs rounded-full px-2 py-0.5"
                                        >
                                          <span>{langObj?.flag}</span>
                                          <span className="truncate max-w-[80px]">
                                            {langObj?.label.split(" (")[0]}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setQuickCreateData((prev) => ({
                                                ...prev,
                                                languages: prev.languages.filter((l) => l !== langVal),
                                              }));
                                            }}
                                            className="ml-0.5 hover:text-blue-900 dark:hover:text-blue-100 leading-none"
                                            aria-label={`Remove language`}
                                          >
                                            ×
                                          </button>
                                        </span>
                                      );
                                    })}
                                    {quickCreateData.languages.filter((l) => l !== "multilingual").length > 3 && (
                                      <span className="inline-flex items-center bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-full px-2 py-0.5">
                                        +{quickCreateData.languages.filter((l) => l !== "multilingual").length - 3} more
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                              <ChevronDown
                                className={`w-4 h-4 flex-shrink-0 text-slate-400 transition-transform ${langDropdownOpen ? "rotate-180" : ""}`}
                              />
                            </button>

                            {/* Dropdown panel */}
                            {langDropdownOpen && (() => {
                              // Determine which languages to show
                              const selectedCountries = quickCreateData.countries;
                              const filteredLangs = selectedCountries.length === 0
                                ? ALL_LANGUAGES
                                : ALL_LANGUAGES.filter((l) => l.countryCodes.some((cc) => selectedCountries.includes(cc)));
                              const displayLangs = filteredLangs.filter((lang) => {
                                const q = langSearch.toLowerCase();
                                return !q || lang.label.toLowerCase().includes(q);
                              });
                              return (
                                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
                                  {/* Search */}
                                  <div className="p-2 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
                                    <div className="relative flex-1">
                                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                      <input
                                        type="text"
                                        value={langSearch}
                                        onChange={(e) => setLangSearch(e.target.value)}
                                        placeholder="Search languages..."
                                        className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => { setLangDropdownOpen(false); setLangSearch(""); }}
                                      className="flex-shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                      aria-label="Close language dropdown"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>

                                  {/* Language list */}
                                  <div className="overflow-y-auto max-h-52">
                                    {displayLangs.map((lang) => {
                                      const isSelected = quickCreateData.languages.includes(lang.value);
                                      return (
                                        <button
                                          key={lang.value}
                                          type="button"
                                          onClick={() => {
                                            const newLangs = isSelected
                                              ? quickCreateData.languages.filter((l) => l !== lang.value)
                                              : [...quickCreateData.languages, lang.value];

                                            // Auto-adjust voice if non-English language selected
                                            const needsMultilingual = newLangs.some(
                                              (l) => !englishOnlyLanguages.includes(l) && l !== "multilingual"
                                            );
                                            const gender = quickCreateData.gender as "female" | "male";
                                            let newVoice = quickCreateData.voice;
                                            if (
                                              needsMultilingual &&
                                              !multilingualVoices[gender].includes(newVoice)
                                            ) {
                                              newVoice = multilingualVoices[gender][0];
                                            }

                                            setQuickCreateData((prev) => ({
                                              ...prev,
                                              languages: newLangs,
                                              voice: newVoice,
                                            }));
                                          }}
                                          className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                                            isSelected
                                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                                              : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                          }`}
                                        >
                                          <span className="text-base w-6 flex-shrink-0 text-center">
                                            {lang.flag}
                                          </span>
                                          <div className="flex-1 min-w-0">
                                            <div className="text-xs font-medium leading-tight">
                                              {lang.label}
                                            </div>
                                          </div>
                                          {isSelected && (
                                            <CheckCircle className="w-4 h-4 flex-shrink-0 text-blue-500" />
                                          )}
                                        </button>
                                      );
                                    })}
                                    {displayLangs.length === 0 && (
                                      <div className="px-4 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                                        {langSearch
                                          ? `No languages found for "${langSearch}"`
                                          : "No languages available for the selected countries"}
                                      </div>
                                    )}
                                  </div>

                                  {/* Footer */}
                                  {quickCreateData.languages.filter((l) => l !== "multilingual").length > 0 && (
                                    <div className="p-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                      <span className="text-xs text-slate-500 dark:text-slate-400">
                                        {quickCreateData.languages.filter((l) => l !== "multilingual").length} selected
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setQuickCreateData((prev) => ({
                                            ...prev,
                                            languages: prev.languages.filter((l) => l === "multilingual"),
                                          }))
                                        }
                                        className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                                      >
                                        Clear all
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Voice Selection — Language Voice */}
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Voice <span className="text-red-500">*</span>
                            <span className="ml-1 text-[10px] text-slate-400 font-normal">— for selected languages</span>
                          </label>
                          <div className="flex gap-2">
                            <select
                              value={quickCreateData.voice}
                              onChange={(e) =>
                                setQuickCreateData((prev) => ({
                                  ...prev,
                                  voice: e.target.value,
                                }))
                              }
                              onFocus={() => setVoiceSelectOpen(true)}
                              onBlur={() => setVoiceSelectOpen(false)}
                              className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm sm:text-base text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all"
                            >
                              {getFilteredVoiceOptions(quickCreateData.gender as 'female' | 'male').map(v => (
                                <option key={v.value} value={v.value}>{v.label}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              disabled={isLoadingVoicePreview}
                              onClick={() => {
                                if (isTestingVoice) {
                                  stopVoicePreview();
                                } else {
                                  previewGeminiVoice(
                                    quickCreateData.voice,
                                    quickCreateData.voiceSpeed,
                                    `Hello! I'm ${quickCreateData.aiEmployeeName || 'your AI assistant'}. How can I help you today?`
                                  );
                                }
                              }}
                              className={`px-4 py-2.5 sm:py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                                isLoadingVoicePreview
                                  ? 'bg-slate-400 dark:bg-slate-600 text-white cursor-not-allowed'
                                  : isTestingVoice
                                  ? 'bg-red-500 hover:bg-red-600 text-white hover:scale-[1.02] active:scale-[0.98]'
                                  : 'common-button-bg hover:scale-[1.02] active:scale-[0.98]'
                              }`}
                            >
                              {isLoadingVoicePreview ? (
                                <>
                                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                  </svg>
                                  <span className="hidden sm:inline">Loading</span>
                                </>
                              ) : isTestingVoice ? (
                                <>
                                  <Square className="w-4 h-4" />
                                  <span className="hidden sm:inline">Stop</span>
                                </>
                              ) : (
                                <>
                                  <Play className="w-4 h-4" />
                                  <span className="hidden sm:inline">Test</span>
                                </>
                              )}
                            </button>
                          </div>
                          <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-1">
                            Choose a voice that matches your brand personality
                          </p>
                        </div>

                        {/* Voice Style Selection */}
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Voice Style
                          </label>
                          <select
                            value={quickCreateData.voiceStyle}
                            onChange={(e) =>
                              setQuickCreateData((prev) => ({
                                ...prev,
                                voiceStyle: e.target.value,
                              }))
                            }
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm sm:text-base text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all"
                          >
                            <option value="friendly">Friendly - Warm & approachable</option>
                            <option value="professional">Professional - Business-like & formal</option>
                            <option value="casual"> Casual - Relaxed & conversational</option>
                            <option value="authoritative">Authoritative - Confident & commanding</option>
                            <option value="empathetic">Empathetic - Understanding & supportive</option>
                            <option value="enthusiastic">Enthusiastic - Energetic & upbeat</option>
                          </select>
                          <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-1">
                            Set the personality tone for your AI assistant
                          </p>
                        </div>

                        {/* Voice Speed Slider */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                              Voice Speed
                            </label>
                            <span className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400">
                              {quickCreateData.voiceSpeed.toFixed(1)}x
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.1"
                            value={quickCreateData.voiceSpeed}
                            onChange={(e) =>
                              setQuickCreateData((prev) => ({
                                ...prev,
                                voiceSpeed: parseFloat(e.target.value),
                              }))
                            }
                            className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            style={{
                              background: `linear-gradient(to right, #2563eb ${((quickCreateData.voiceSpeed - 0.5) / (2.0 - 0.5)) * 100}%, #e2e8f0 ${((quickCreateData.voiceSpeed - 0.5) / (2.0 - 0.5)) * 100}%)`,
                            }}
                          />
                          <div className="flex justify-between text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-1">
                            <span>Slower (0.5x)</span>
                            <span>Normal (1.0x)</span>
                            <span>Faster (2.0x)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Business Process */}
                  {!isCreatingAgent && quickCreateStep === 3 && (
                    <div className="space-y-3 sm:space-y-4 animate-fadeIn">
                      <div className="text-center mb-4 sm:mb-6">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center">
                          <Briefcase className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white mb-1 sm:mb-2">
                          What should your AI Employee do?
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto px-2">
                          Select the main task your AI will handle. This
                          determines how it responds and what skills it
                          prioritizes.
                        </p>
                      </div>

                      {/* Business Process Slider */}
                      <div className="relative">
                        {/* Navigation Arrows */}
                        <button
                          onClick={() =>
                            setBusinessProcessSlideIndex(
                              Math.max(0, businessProcessSlideIndex - 1),
                            )
                          }
                          disabled={businessProcessSlideIndex === 0}
                          className={`absolute -left-2 sm:-left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all ${
                            businessProcessSlideIndex === 0
                              ? "opacity-40 cursor-not-allowed"
                              : "hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-110"
                          }`}
                        >
                          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-300" />
                        </button>

                        <button
                          onClick={() =>
                            setBusinessProcessSlideIndex(
                              Math.min(
                                Math.ceil(businessProcessOptions.length / 2) -
                                  1,
                                businessProcessSlideIndex + 1,
                              ),
                            )
                          }
                          disabled={
                            businessProcessSlideIndex >=
                            Math.ceil(businessProcessOptions.length / 2) - 1
                          }
                          className={`absolute -right-2 sm:-right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all ${
                            businessProcessSlideIndex >=
                            Math.ceil(businessProcessOptions.length / 2) - 1
                              ? "opacity-40 cursor-not-allowed"
                              : "hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-110"
                          }`}
                        >
                          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-300" />
                        </button>

                        {/* Cards Container - 2 cards per slide */}
                        <div 
                          className="overflow-x-auto px-1 sm:px-2 touch-pan-x snap-x [&::-webkit-scrollbar]:hidden"
                          style={{
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none'
                          }}
                        >
                          <div
                            className="flex transition-transform duration-300 ease-out"
                            style={{
                              transform: `translateX(-${businessProcessSlideIndex * 100}%)`,
                            }}
                          >
                            {Array.from({
                              length: Math.ceil(
                                businessProcessOptions.length / 2,
                              ),
                            }).map((_, slideIdx) => (
                              <div
                                key={slideIdx}
                                className="flex gap-2 sm:gap-4 min-w-full flex-shrink-0"
                              >
                                {businessProcessOptions
                                  .slice(slideIdx * 2, slideIdx * 2 + 2)
                                  .map((option) => (
                                    <button
                                      key={option.value}
                                      onClick={() =>
                                        setQuickCreateData((prev) => ({
                                          ...prev,
                                          businessProcess: option.value,
                                        }))
                                      }
                                      className={`flex-1 p-3 sm:p-4 rounded-xl border-2 text-center transition-colors duration-200 relative ${
                                        quickCreateData.businessProcess ===
                                        option.value
                                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md"
                                          : "border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 bg-white dark:bg-slate-800/50"
                                      }`}
                                    >
                                      {quickCreateData.businessProcess ===
                                        option.value && (
                                        <CheckCircle className="w-4 h-4 text-blue-500 absolute top-2 right-2" />
                                      )}
                                      <span className="text-2xl sm:text-3xl mb-1 sm:mb-2 block">
                                        {option.icon}
                                      </span>
                                      <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-white block">
                                        {option.label}
                                      </span>
                                    </button>
                                  ))}
                                {businessProcessOptions.slice(
                                  slideIdx * 2,
                                  slideIdx * 2 + 2,
                                ).length === 1 && <div className="flex-1" />}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Dots Indicator */}
                        <div className="flex justify-center gap-1.5 sm:gap-2 mt-3 sm:mt-4">
                          {Array.from({
                            length: Math.ceil(
                              businessProcessOptions.length / 2,
                            ),
                          }).map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setBusinessProcessSlideIndex(idx)}
                              className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${
                                businessProcessSlideIndex === idx
                                  ? "bg-blue-500 w-4 sm:w-6"
                                  : "bg-slate-300 dark:bg-slate-600 hover:bg-slate-400"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Industry */}
                  {!isCreatingAgent && quickCreateStep === 4 && (
                    <div className="space-y-3 sm:space-y-4 animate-fadeIn">
                      <div className="text-center mb-4 sm:mb-6">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center">
                          <Factory className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white mb-1 sm:mb-2">
                          What industry are you in?
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto px-2">
                          Your AI will use industry-specific language,
                          understand common terms, and follow your industry best
                          practices.
                        </p>
                      </div>

                      <div className="relative">
                        <button
                          onClick={() =>
                            setIndustrySlideIndex(
                              Math.max(0, industrySlideIndex - 1),
                            )
                          }
                          disabled={industrySlideIndex === 0}
                          className={`absolute -left-2 sm:-left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all ${
                            industrySlideIndex === 0
                              ? "opacity-40 cursor-not-allowed"
                              : "hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-110"
                          }`}
                        >
                          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-300" />
                        </button>

                        <button
                          onClick={() =>
                            setIndustrySlideIndex(
                              Math.min(
                                Math.ceil(industryOptions.length / 6) - 1,
                                industrySlideIndex + 1,
                              ),
                            )
                          }
                          disabled={
                            industrySlideIndex >=
                            Math.ceil(industryOptions.length / 6) - 1
                          }
                          className={`absolute -right-2 sm:-right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all ${
                            industrySlideIndex >=
                            Math.ceil(industryOptions.length / 6) - 1
                              ? "opacity-40 cursor-not-allowed"
                              : "hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-110"
                          }`}
                        >
                          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-300" />
                        </button>

                        {/* Cards Container */}
                        <div 
                          className="overflow-x-auto px-1 sm:px-2 touch-pan-x snap-x [&::-webkit-scrollbar]:hidden"
                          style={{
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none'
                          }}
                        >
                          <div
                            className="flex transition-transform duration-300 ease-out"
                            style={{
                              transform: `translateX(-${industrySlideIndex * 100}%)`,
                            }}
                          >
                            {Array.from({
                              length: Math.ceil(industryOptions.length / 6),
                            }).map((_, slideIdx) => (
                              <div
                                key={slideIdx}
                                className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 min-w-full"
                              >
                                {industryOptions
                                  .slice(slideIdx * 6, slideIdx * 6 + 6)
                                  .map((option) => (
                                    <button
                                      key={option.value}
                                      onClick={() =>
                                        setQuickCreateData((prev) => ({
                                          ...prev,
                                          industry: option.value,
                                          subIndustry: "",
                                        }))
                                      }
                                      className={`p-2 sm:p-3 rounded-xl border-2 text-center transition-colors duration-200 relative ${
                                        quickCreateData.industry ===
                                        option.value
                                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md"
                                          : "border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 bg-white dark:bg-slate-800/50"
                                      }`}
                                    >
                                      {quickCreateData.industry ===
                                        option.value && (
                                        <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-500 absolute top-1 right-1 sm:top-1.5 sm:right-1.5" />
                                      )}
                                      <span className="text-xl sm:text-2xl mb-0.5 sm:mb-1 block">
                                        {option.icon}
                                      </span>
                                      <span className="text-[10px] sm:text-xs font-medium text-slate-800 dark:text-white leading-tight">
                                        {option.label}
                                      </span>
                                    </button>
                                  ))}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Dots Indicator */}
                        <div className="flex justify-center gap-1.5 sm:gap-2 mt-3 sm:mt-4">
                          {Array.from({
                            length: Math.ceil(industryOptions.length / 6),
                          }).map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setIndustrySlideIndex(idx)}
                              className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${
                                industrySlideIndex === idx
                                  ? "bg-blue-500 w-4 sm:w-6"
                                  : "bg-slate-300 dark:bg-slate-600 hover:bg-slate-400"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 5: Sub-Industry */}
                  {!isCreatingAgent && quickCreateStep === 5 && (
                    <div className="space-y-3 sm:space-y-4 animate-fadeIn">
                      <div className="text-center mb-4 sm:mb-6">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center">
                          <Layers className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 dark:text-orange-400" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white mb-1 sm:mb-2">
                          Specify your niche
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto px-2">
                          Select a sub-category for{" "}
                          <span className="font-semibold text-blue-600 dark:text-blue-400">
                            {
                              industryOptions.find(
                                (i) => i.value === quickCreateData.industry,
                              )?.label
                            }
                          </span>{" "}
                          to help your AI understand specific terminology and
                          practices.
                        </p>
                      </div>
                      {quickCreateData?.industry &&
                      subIndustryOptions[quickCreateData?.industry] ? (
                        <div className="relative">
                          {/* Navigation Buttons */}
                          <button
                            onClick={() =>
                              setSubIndustrySlideIndex(
                                Math.max(0, subIndustrySlideIndex - 1),
                              )
                            }
                            disabled={subIndustrySlideIndex === 0}
                            className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 sm:-translate-x-4 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-lg flex items-center justify-center transition-all duration-200 ${
                              subIndustrySlideIndex === 0
                                ? "opacity-30 cursor-not-allowed"
                                : "hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-orange-300 dark:hover:border-orange-600"
                            }`}
                          >
                            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-300" />
                          </button>

                          <button
                            onClick={() =>
                              setSubIndustrySlideIndex(
                                Math.min(
                                  Math.ceil(
                                    subIndustryOptions[quickCreateData.industry]
                                      .length / 6,
                                  ) - 1,
                                  subIndustrySlideIndex + 1,
                                ),
                              )
                            }
                            disabled={
                              subIndustrySlideIndex >=
                              Math.ceil(
                                subIndustryOptions[quickCreateData.industry]
                                  .length / 6,
                              ) -
                                1
                            }
                            className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 sm:translate-x-4 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-lg flex items-center justify-center transition-all duration-200 ${
                              subIndustrySlideIndex >=
                              Math.ceil(
                                subIndustryOptions[quickCreateData.industry]
                                  .length / 6,
                              ) -
                                1
                                ? "opacity-30 cursor-not-allowed"
                                : "hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-orange-300 dark:hover:border-orange-600"
                            }`}
                          >
                            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-300" />
                          </button>

                          {/* Cards Container */}
                          <div 
                            className="overflow-x-auto px-1 sm:px-2 touch-pan-x snap-x [&::-webkit-scrollbar]:hidden"
                            style={{
                              scrollbarWidth: 'none',
                              msOverflowStyle: 'none'
                            }}
                          >
                            <div
                              className="flex transition-transform duration-300 ease-out"
                              style={{
                                transform: `translateX(-${subIndustrySlideIndex * 100}%)`,
                              }}
                            >
                              {Array.from({
                                length: Math.ceil(
                                  subIndustryOptions[quickCreateData.industry]
                                    .length / 6,
                                ),
                              }).map((_, slideIdx) => (
                                <div
                                  key={slideIdx}
                                  className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 min-w-full auto-rows-fr"
                                >
                                  {subIndustryOptions[quickCreateData.industry]
                                    .slice(slideIdx * 6, slideIdx * 6 + 6)
                                    .map((option) => (
                                      <button
                                        key={option.value}
                                        onClick={() =>
                                          setQuickCreateData((prev) => ({
                                            ...prev,
                                            subIndustry: option.value,
                                          }))
                                        }
                                        className={`p-2 sm:p-3 rounded-xl border-2 text-center transition-colors duration-200 relative h-[70px] sm:h-[80px] flex items-center justify-center ${
                                          quickCreateData.subIndustry ===
                                          option.value
                                            ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 shadow-md"
                                            : "border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-600 bg-white dark:bg-slate-800/50"
                                        }`}
                                      >
                                        {quickCreateData.subIndustry ===
                                          option.value && (
                                          <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-500 absolute top-1 right-1 sm:top-1.5 sm:right-1.5" />
                                        )}
                                        <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-white px-1 leading-tight">
                                          {option.label}
                                        </span>
                                      </button>
                                    ))}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Slide Indicators */}
                          {Math.ceil(
                            subIndustryOptions[quickCreateData.industry]
                              .length / 6,
                          ) > 1 && (
                            <div className="flex justify-center gap-1.5 sm:gap-2 mt-3 sm:mt-4">
                              {Array.from({
                                length: Math.ceil(
                                  subIndustryOptions[quickCreateData.industry]
                                    .length / 6,
                                ),
                              }).map((_, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setSubIndustrySlideIndex(idx)}
                                  className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                                    idx === subIndustrySlideIndex
                                      ? "w-6 sm:w-8 bg-orange-500"
                                      : "w-1.5 sm:w-2 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400"
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                          <p>
                            No sub-industries available for selected industry
                          </p>
                          <p className="text-sm mt-2">You can skip this step</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 6: Knowledge Base */}
                  {quickCreateStep === 6 && !isCreatingAgent && (
                    <div className="space-y-3 sm:space-y-4 animate-fadeIn">
                      <div className="text-center mb-4 sm:mb-6">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center">
                          <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-600 dark:text-cyan-400" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white mb-1 sm:mb-2">
                          Train Your AI
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto px-2">
                          Upload your documents, FAQs, or website links. Your AI
                          will learn from these to give accurate,
                          company-specific answers.
                        </p>
                      </div>

                      {/* Scrollable Content Container */}
                      <div 
                        className=" space-y-3 sm:space-y-4 [&::-webkit-scrollbar]:hidden"
                        style={{
                          scrollbarWidth: 'none',
                          msOverflowStyle: 'none'
                        }}
                      >
                        {/* File Upload Section */}
                        <div className="space-y-3">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <Upload className="w-4 h-4" />
                          Upload Files{!quickCreateData.uploadedFiles.length && !quickCreateData.websiteUrls.some(u => u.trim()) && <span className="text-red-500 text-xs">(required — at least one file or URL)</span>}
                        </label>

                        {/* Drop Zone */}
                        <div
                          className={`border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-4 sm:p-6 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer bg-slate-50/50 dark:bg-slate-800/50 ${isUploadingFiles || isExtractingContent ? 'opacity-50 pointer-events-none' : ''}`}
                          onClick={() =>
                            !isUploadingFiles && !isExtractingContent && document
                              .getElementById("knowledge-file-input")
                              ?.click()
                          }
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (!isUploadingFiles && !isExtractingContent) {
                              e.currentTarget.classList.add(
                                "border-blue-400",
                                "bg-blue-50/50",
                              );
                            }
                          }}
                          onDragLeave={(e) => {
                            e.currentTarget.classList.remove(
                              "border-blue-400",
                              "bg-blue-50/50",
                            );
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove(
                              "border-blue-400",
                              "bg-blue-50/50",
                            );
                            if (!isUploadingFiles && !isExtractingContent) {
                              const files = Array.from(e.dataTransfer.files);
                              handleKnowledgeBaseUpload(files);
                            }
                          }}
                        >
                          <input
                            id="knowledge-file-input"
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                            className="hidden"
                            disabled={isUploadingFiles || isExtractingContent}
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              handleKnowledgeBaseUpload(files);
                              e.target.value = "";
                            }}
                          />
                          <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                            {isUploadingFiles || isExtractingContent ? (
                              <>
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                  {isExtractingContent ? 'Extracting content from files...' : 'Uploading files...'}
                                </p>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-2 sm:gap-3 text-slate-400">
                                  <FileText className="w-6 h-6 sm:w-8 sm:h-8" />
                                  <File className="w-6 h-6 sm:w-8 sm:h-8" />
                                </div>
                                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                  <span className="text-blue-500 font-medium">
                                    Click to upload
                                  </span>{" "}
                                  or drag and drop
                                </p>
                                <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500">
                                  PDF, DOC, DOCX, TXT, CSV, Excel (max 10MB each)
                                </p>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Uploaded Files List */}
                        {quickCreateData.uploadedFiles.length > 0 && (
                          <div className="space-y-1.5 sm:space-y-2 max-h-24 sm:max-h-32 overflow-y-auto">
                            {quickCreateData.uploadedFiles.map(
                              (file, index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 bg-slate-100 dark:bg-slate-800 rounded-lg"
                                >
                                  {file.type.includes("image") ? (
                                    <Image className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                                  ) : file.type.includes("pdf") ? (
                                    <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 flex-shrink-0" />
                                  ) : (
                                    <File className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                                  )}
                                  <span className="flex-1 text-xs sm:text-sm text-slate-700 dark:text-slate-300 truncate">
                                    {file.name}
                                  </span>
                                  <span className="text-[10px] sm:text-xs text-slate-400 hidden sm:inline">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                  </span>
                                  {quickCreateData.uploadedFileUrls[index] && (
                                    <span className="text-[10px] sm:text-xs text-green-500">
                                      ✓
                                    </span>
                                  )}
                                  <button
                                    onClick={() => handleRemoveKnowledgeBaseFile(index)}
                                    disabled={isUploadingFiles}
                                    className="p-0.5 sm:p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors disabled:opacity-50"
                                  >
                                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  </button>
                                </div>
                              ),
                            )}
                          </div>
                        )}
                      </div>

                      {/* File Quality Error Display */}
                      {fileQualityErrors.length > 0 && (
                        <div className="space-y-2">
                          {fileQualityErrors.map((err, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-2.5 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
                            >
                              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-red-700 dark:text-red-400 truncate">
                                  {err.fileName}
                                </p>
                                <ul className="mt-1 space-y-0.5">
                                  {err.issues.map((issue, j) => (
                                    <li key={j} className="text-[11px] sm:text-xs text-red-600 dark:text-red-400">
                                      • {issue}
                                    </li>
                                  ))}
                                </ul>
                                <p className="mt-1.5 text-[11px] sm:text-xs text-red-500 dark:text-red-400 font-medium">
                                  Please fix the issues above and re-upload this file.
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Website URLs Section */}
                      <div className="space-y-2 sm:space-y-3">
                        <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <Link className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          Website URLs <span className="text-red-500">*</span>
                        </label>
                        {quickCreateData.websiteUrls.map((url, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-1.5 sm:gap-2"
                          >
                            <input
                              type="url"
                              value={url}
                              onChange={(e) =>
                                handleWebsiteUrlChange(index, e.target.value)
                              }
                              placeholder="https://yourcompany.com"
                              className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all"
                            />
                            {quickCreateData.websiteUrls.length > 1 && (
                              <button
                                onClick={() => handleRemoveWebsiteUrl(index)}
                                className="p-2 sm:p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                              >
                                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={handleAddWebsiteUrl}
                          className="w-full py-2 sm:py-2.5 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm"
                        >
                          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          Add another URL
                        </button>
                      </div>

                      {/* Social Media URLs Section */}
                      <div className="space-y-2 sm:space-y-3">
                        <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          Social Media Links
                        </label>
                        {quickCreateData.socialMediaUrls.map((url, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-1.5 sm:gap-2"
                          >
                            <input
                              type="url"
                              value={url}
                              onChange={(e) =>
                                handleSocialMediaUrlChange(index, e.target.value)
                              }
                              placeholder="https://facebook.com/yourpage or https://x.com/yourhandle"
                              className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all"
                            />
                            {quickCreateData.socialMediaUrls.length > 1 && (
                              <button
                                onClick={() => handleRemoveSocialMediaUrl(index)}
                                className="p-2 sm:p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                              >
                                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={handleAddSocialMediaUrl}
                          className="w-full py-2 sm:py-2.5 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm"
                        >
                          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          Add social media link
                        </button>
                      </div>

                      {/* Summary */}
                      {(quickCreateData.uploadedFiles.length > 0 ||
                        quickCreateData.websiteUrls.some((u) => u.trim()) ||
                        quickCreateData.socialMediaUrls.some((u) => u.trim())) && (
                        <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                          <p className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400">
                            📚 {quickCreateData.uploadedFiles.length} file(s),{" "}
                            {
                              quickCreateData.websiteUrls.filter((u) =>
                                u.trim(),
                              ).length
                            }{" "}
                            URL(s), and{" "}
                            {
                              quickCreateData.socialMediaUrls.filter((u) =>
                                u.trim(),
                              ).length
                            }{" "}
                            social media link(s) will be added to knowledge base
                          </p>
                        </div>
                      )}
                      </div>
                      {/* End of Scrollable Content Container */}
                    </div>
                  )}

                  {/* Step 7: Template Selection with AI-Generated Templates */}
                  {!isCreatingAgent && quickCreateStep === 7 &&
                    (() => {
                      // Use AI-generated templates, fallback to scored templates
                      const templates =
                        aiGeneratedTemplates.length > 0
                          ? aiGeneratedTemplates
                          : getMatchingTemplatesScored().map((t) => ({
                              name: t.template.name,
                              description: t.template.description,
                              icon: t.template.icon,
                              features: t.template.features,
                            }));

                      console.log("📊 Template carousel:", {
                        totalTemplates: templates.length,
                        templates: templates.map((t) => t.name),
                        templateSlideIndex,
                      });

                      // Mobile: 1 card per slide, Desktop: 2 cards per slide
                      const isMobile = window.innerWidth < 768;
                      const cardsPerSlide = isMobile ? 1 : 2;
                      const totalSlides = Math.ceil(
                        templates.length / cardsPerSlide,
                      );

                      console.log("🎠 Carousel config:", {
                        isMobile,
                        cardsPerSlide,
                        totalSlides,
                        totalTemplates: templates.length,
                      });

                      return (
                        <div className="space-y-3 sm:space-y-4 animate-fadeIn">
                          {/* Loading State - Show only while generating */}
                          {isGeneratingTemplates ? (
                            <div className="h-64 sm:h-80 flex items-center justify-center">
                              <div className="text-center space-y-6 sm:space-y-8">
                                {/* Animated Icon */}
                                <div className="flex justify-center">
                                  <div className="relative">
                                    {/* Pulsing Background Rings */}
                                 
                                    <div className="absolute inset-0 flex items-center justify-center animate-ping">
                                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-r from-pink-400/10 via-purple-400/10 to-blue-400/10"></div>
                                    </div>
                                    
                                    {/* Main Icon Container */}
                                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto">
                                      {/* Rotating Gradient Ring */}
                                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 animate-spin" style={{ animationDuration: '3s' }}></div>
                                      <div className="absolute inset-1 rounded-full bg-white dark:bg-slate-900"></div>
                                      
                                      {/* Center Icon - Aimark Logo */}
                                      <div className="absolute inset-0 flex items-center justify-center p-3">
                                        <img 
                                          src="/Aimark2.png"
                                          alt="AI Bot"
                                          className="w-full h-full object-contain animate-pulse"
                                          style={{ filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.5))' }}
                                        />
                                      </div>
                                      
                                      {/* Orbiting Dots */}
                                      <div className="absolute inset-0 animate-spin" style={{ animationDuration: '2s' }}>
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-pink-500"></div>
                                      </div>
                                      <div className="absolute inset-0 animate-spin" style={{ animationDuration: '2s', animationDelay: '0.66s' }}>
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-purple-500"></div>
                                      </div>
                                      <div className="absolute inset-0 animate-spin" style={{ animationDuration: '2s', animationDelay: '1.33s' }}>
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-blue-500"></div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Animated Text Messages */}
                                <div className="space-y-3">
                                  <div className="h-8 sm:h-10 flex items-center justify-center overflow-hidden">
                                    <div className="animate-slideUp">
                                      <p className="text-base sm:text-lg font-semibold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent whitespace-nowrap">
                                        {generationProgress < 20 && "✨ Analyzing your business..."}
                                        {generationProgress >= 20 && generationProgress < 40 && "🎯 Understanding your industry..."}
                                        {generationProgress >= 40 && generationProgress < 60 && "🚀 Creating something amazing..."}
                                        {generationProgress >= 60 && generationProgress < 80 && "💡 Crafting perfect templates..."}
                                        {generationProgress >= 80 && generationProgress < 95 && "🎨 Adding final touches..."}
                                        {generationProgress >= 95 && "✅ Almost ready!"}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {/* Progress Indicator */}
                                  <div className="max-w-xs mx-auto space-y-2">
                                    <div className="flex justify-between items-center text-xs sm:text-sm">
                                      <span className="text-slate-600 dark:text-slate-400 font-medium">
                                        {generationProgress < 100 ? "Processing..." : "Complete!"}
                                      </span>
                                      <span className="text-slate-700 dark:text-slate-300 font-semibold">
                                        {Math.round(generationProgress)}%
                                      </span>
                                    </div>
                                    {/* Modern Progress Bar */}
                                    <div className="relative h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                      <div 
                                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-full transition-all duration-500 ease-out"
                                        style={{ width: `${generationProgress}%` }}
                                      >
                                        {/* Shimmer Effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Subtle Hint Text */}
                                  <p className="text-xs text-slate-500 dark:text-slate-500 animate-pulse">
                                    Hang tight, we're building your AI Employee in 
                                    <span className="font-semibold text-purple-600 dark:text-purple-400"> 7 simple steps</span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <>
                              {/* Header */}
                              <div className="text-center mb-4 sm:mb-6">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center">
                                  <Bot className="w-6 h-6 sm:w-8 sm:h-8 text-pink-600 dark:text-pink-400" />
                                </div>
                                <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-white mb-1 sm:mb-2">
                                  Recommended Templates
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto px-2">
                                  Based on your selections, here are the best
                                  templates for your AI Employee.
                                </p>
                              </div>

                              {/* Selection Summary - Minimalist Version */}
                              {(quickCreateData.businessProcess ||
                                quickCreateData.industry ||
                                quickCreateData.subIndustry) && (
                                <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                                  {quickCreateData.businessProcess && (
                                    <span className="px-2 sm:px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-[10px] sm:text-xs font-medium">
                                      {
                                        businessProcessOptions.find(
                                          (b) =>
                                            b.value ===
                                            quickCreateData.businessProcess,
                                        )?.icon
                                      }{" "}
                                      {
                                        businessProcessOptions.find(
                                          (b) =>
                                            b.value ===
                                            quickCreateData.businessProcess,
                                        )?.label
                                      }
                                    </span>
                                  )}
                                  {quickCreateData.industry && (
                                    <span className="px-2 sm:px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-[10px] sm:text-xs font-medium">
                                      {
                                        industryOptions.find(
                                          (i) =>
                                            i.value ===
                                            quickCreateData.industry,
                                        )?.icon
                                      }{" "}
                                      {
                                        industryOptions.find(
                                          (i) =>
                                            i.value ===
                                            quickCreateData.industry,
                                        )?.label
                                      }
                                    </span>
                                  )}
                                  {quickCreateData.subIndustry && (
                                    <span className="px-2 sm:px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-[10px] sm:text-xs font-medium">
                                      {
                                        subIndustryOptions[
                                          quickCreateData.industry
                                        ]?.find(
                                          (s) =>
                                            s.value ===
                                            quickCreateData.subIndustry,
                                        )?.label
                                      }
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Template Slider - 2 cards per slide */}
                              <div className="relative">
                                {/* Navigation Arrows */}
                                <button
                                  onClick={() =>
                                    setTemplateSlideIndex(
                                      Math.max(0, templateSlideIndex - 1),
                                    )
                                  }
                                  disabled={templateSlideIndex === 0}
                                  className={`absolute -left-2 sm:-left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all ${
                                    templateSlideIndex === 0
                                      ? "opacity-40 cursor-not-allowed"
                                      : "hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-110"
                                  }`}
                                >
                                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-300" />
                                </button>

                                <button
                                  onClick={() =>
                                    setTemplateSlideIndex(
                                      Math.min(
                                        totalSlides - 1,
                                        templateSlideIndex + 1,
                                      ),
                                    )
                                  }
                                  disabled={
                                    templateSlideIndex >= totalSlides - 1
                                  }
                                  className={`absolute -right-2 sm:-right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all ${
                                    templateSlideIndex >= totalSlides - 1
                                      ? "opacity-40 cursor-not-allowed"
                                      : "hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-110"
                                  }`}
                                >
                                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-300" />
                                </button>

                                {/* Cards Container - 1 card per slide on mobile, 2 on desktop */}
                                <div 
                                  className="overflow-x-auto px-1 sm:px-2 touch-pan-x snap-x [&::-webkit-scrollbar]:hidden"
                                  style={{
                                    scrollbarWidth: 'none',
                                    msOverflowStyle: 'none'
                                  }}
                                >
                                  <div
                                    className="flex transition-transform duration-300 ease-out"
                                    style={{
                                      transform: `translateX(-${templateSlideIndex * 100}%)`,
                                    }}
                                  >
                                    {isGeneratingTemplates ? (
                                      <div className="w-full h-64 flex items-center justify-center">
                                        <div className="text-center">
                                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-3"></div>
                                          <p className="text-sm text-slate-600 dark:text-slate-400">
                                            Generating templates...
                                          </p>
                                        </div>
                                      </div>
                                    ) : templateGenerationError ? (
                                      <div className="w-full h-64 flex items-center justify-center">
                                        <div className="text-center">
                                          <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                                            {templateGenerationError}
                                          </p>
                                          <button
                                            onClick={() =>
                                              generateAITemplates()
                                            }
                                            className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                          >
                                            Retry
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      Array.from({ length: totalSlides }).map(
                                        (_, slideIdx) => {
                                          const slideCards = templates.slice(
                                            slideIdx * cardsPerSlide,
                                            slideIdx * cardsPerSlide +
                                              cardsPerSlide,
                                          );
                                          return (
                                            <div
                                              key={slideIdx}
                                              className="flex gap-2 sm:gap-4 min-w-full flex-shrink-0 justify-center sm:justify-start"
                                            >
                                              {slideCards.map(
                                                (template, idx) => {
                                                  const templateKey = `${slideIdx}-${idx}`;
                                                  const isSelected =
                                                    quickCreateData.selectedTemplate ===
                                                    template.name;
                                                  const sysPromptPending =
                                                    isGeneratingSystemPrompts &&
                                                    (!(template as GeneratedTemplate).systemPrompt ||
                                                      (template as GeneratedTemplate).systemPrompt!.length < 100);
                                                  return (
                                                    <div
                                                      key={templateKey}
                                                      onClick={() => {
                                                        if (sysPromptPending) return;
                                                        setQuickCreateData(
                                                          (prev) => ({
                                                            ...prev,
                                                            selectedTemplate:
                                                              isSelected
                                                                ? null
                                                                : template.name,
                                                          }),
                                                        );
                                                      }}
                                                      className={`${isMobile ? "w-full max-w-xs" : " max-w-[260px]"} p-3 sm:p-4 rounded-xl border-2 text-left transition-colors duration-200 relative ${
                                                        sysPromptPending
                                                          ? "cursor-not-allowed opacity-70 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50"
                                                          : quickCreateData.selectedTemplate === template.name
                                                            ? "cursor-pointer border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md"
                                                            : "cursor-pointer border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/50"
                                                      }`}
                                                    >
                                                      {/* Top-right: spinner while system prompt generates, checkmark when selected */}
                                                      {sysPromptPending ? (
                                                        <div className="absolute top-2 right-2" title="Generating system prompt…">
                                                          <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
                                                        </div>
                                                      ) : isSelected ? (
                                                        <CheckCircle className="w-4 h-4 text-blue-500 absolute top-2 right-2" />
                                                      ) : null}

                                                      <div className="flex flex-col h-full mt-1">
                                                        <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                                                          <span className="text-xl sm:text-2xl">
                                                            {template.icon}
                                                          </span>
                                                          <h4 className="font-semibold text-slate-800 dark:text-white text-xs sm:text-sm flex-1">
                                                            {template.name}
                                                          </h4>
                                                        </div>
                                                        <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-1.5 sm:mb-2 line-clamp-2 max-w-[260px]">
                                                          {template.description}
                                                        </p>

                                                        <div className="flex flex-wrap gap-1 mb-2">
                                                          {template.features
                                                            .slice(0, 2)
                                                            .map(
                                                              (feature, i) => (
                                                                <span
                                                                  key={i}
                                                                  className="px-1.5 sm:px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-[10px] sm:text-xs"
                                                                >
                                                                  {feature}
                                                                </span>
                                                              ),
                                                            )}
                                                        </div>

                                                        <button
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedTemplateForDetails(
                                                              template.name,
                                                            );
                                                            setShowTemplateDetails(
                                                              true,
                                                            );
                                                          }}
                                                          className="mt-auto pt-2 w-full px-2.5 py-1.5 sm:py-2 bg-blue-500/10 hover:bg-blue-500/20 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-colors border border-blue-200 dark:border-blue-900/30"
                                                        >
                                                          <Eye className="w-4 h-4" />
                                                          <span className="text-xs sm:text-sm">
                                                            View Details
                                                          </span>
                                                        </button>
                                                      </div>
                                                    </div>
                                                  );
                                                },
                                              )}
                                            </div>
                                          );
                                        },
                                      )
                                    )}
                                  </div>
                                </div>

                                {/* Dots Indicator */}
                                <div className="flex justify-center gap-1.5 sm:gap-2 mt-3 sm:mt-4">
                                  {Array.from({ length: totalSlides }).map(
                                    (_, idx) => (
                                      <button
                                        key={idx}
                                        onClick={() =>
                                          setTemplateSlideIndex(idx)
                                        }
                                        className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${
                                          templateSlideIndex === idx
                                            ? "bg-blue-500 w-4 sm:w-6"
                                            : "bg-slate-300 dark:bg-slate-600 hover:bg-slate-400"
                                        }`}
                                      />
                                    ),
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })()}
                </div>

                {/* Footer */}
                <div className="p-3 sm:p-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex-shrink-0">
                  {isCreatingAgent ? (
                    /* During creation show minimal footer */
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <svg className="w-4 h-4 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      <span>
                        {kbCreationProgress?.status === 'completed'
                          ? 'Finalizing...'
                          : `Building ${quickCreateData.aiEmployeeName || 'your AI employee'}...`}
                      </span>
                    </div>
                  ) : (
                  <div className="flex items-center justify-between gap-2 sm:gap-3">
                    {quickCreateStep > 1 ? (
                      <button
                        onClick={handleQuickCreateBack}
                        className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors text-sm"
                      >
                        <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Back
                      </button>
                    ) : (
                      <div />
                    )}

                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {quickCreateStep < 7 ? (
                        <button
                          onClick={handleQuickCreateNext}
                          disabled={!canProceedToNextStep() || (quickCreateStep === 2 && (countryDropdownOpen || langDropdownOpen))}
                          className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-medium transition-all text-sm sm:text-base ${
                            canProceedToNextStep() && !(quickCreateStep === 2 && (countryDropdownOpen || langDropdownOpen))
                              ? "common-button-bg hover:scale-[1.02] active:scale-[0.98]"
                              : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                          }`}
                        >
                          Continue
                          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={handleProceedToCreate}
                          disabled={
                            isGeneratingTemplates ||
                            isGeneratingSystemPrompts ||
                            !quickCreateData.selectedTemplate ||
                            isCreatingAgent
                          }
                          className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-medium transition-all text-sm sm:text-base ${
                            isGeneratingTemplates ||
                            isGeneratingSystemPrompts ||
                            !quickCreateData.selectedTemplate ||
                            isCreatingAgent
                              ? "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                              : "common-button-bg hover:scale-[1.02] active:scale-[0.98]"
                          }`}
                        >
                          {isCreatingAgent ? (
                            <>
                              <svg className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>
                                {kbCreationProgress?.progress !== undefined ? `${Math.round(kbCreationProgress.progress)}%` : 'Creating...'}
                              </span>
                            </>
                          ) : isGeneratingSystemPrompts ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-slate-600 dark:border-slate-500 dark:border-t-slate-300 rounded-full animate-spin" />
                              <span className="hidden sm:inline">Building prompts…</span>
                              <span className="sm:hidden">Building…</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              <span className="hidden sm:inline">
                                Create AI Employee
                              </span>
                              <span className="sm:hidden">Create</span>
                              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  )} {/* end isCreatingAgent ternary */}

                </div>
              </div>
            </div>,
            document.body,
          )}

        {/* Template Details Modal */}
        {showTemplateDetails &&
          selectedTemplateForDetails &&
          createPortal(
            <div 
              className="fixed inset-0 z-[65] flex items-center justify-center p-2 sm:p-4"
              onTouchMove={(e) => e.target === e.currentTarget && e.preventDefault()}
            >
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/60"
                onTouchMove={(e) => e.preventDefault()}
              />

              {/* Modal */}
              <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl h-[95vh] sm:h-auto sm:max-h-[85vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700">
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-slate-100 dark:bg-slate-800">
                      {aiGeneratedTemplates.find(
                        (t) => t.name === selectedTemplateForDetails,
                      )?.icon ||
                        aiEmployeeTemplates[selectedTemplateForDetails]?.icon ||
                        "🤖"}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg font-bold text-slate-800 dark:text-white line-clamp-1">
                        {selectedTemplateForDetails}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        AI Employee Template
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTemplateDetails(false)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                {/* Section Navigation Tabs */}
                <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/50 backdrop-blur-sm">
                  <div 
                    className="flex overflow-x-auto px-2 sm:px-4 py-2 gap-1 [&::-webkit-scrollbar]:hidden"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {templateSections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => scrollToTemplateSection(section.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all
                          ${activeTemplateSection === section.id
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                      >
                        {section.label}
                        {section.id === 'system-prompt' &&
                          isGeneratingSystemPrompts &&
                          !spReadyTemplates.has(selectedTemplateForDetails ?? '') && (
                            <div className="w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin opacity-70" />
                          )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div 
                  ref={templateContentRef}
                  onScroll={handleTemplateScroll}
                  className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0 space-y-4 scroll-smooth"
                >
                  {(() => {
                    // Try to find in AI-generated templates first, then fallback to predefined
                    const aiTemplate = aiGeneratedTemplates.find(
                      (t) => t.name === selectedTemplateForDetails,
                    );
                    const predefinedTemplate =
                      aiEmployeeTemplates[selectedTemplateForDetails];
                    const template = aiTemplate || predefinedTemplate;

                    if (!template) return null;

                    return (
                      <>
                        {/* Section Markers for Navigation */}
                        <div id="template-section-overview" className="scroll-mt-2" />
                        
                        {/* Description */}
                        <div>
                          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Description
                          </h3>
                          {isEditingTemplate ? (
                            <textarea
                              value={editedTemplate?.description || ""}
                              onChange={(e) =>
                                setEditedTemplate((prev) => ({
                                  ...prev,
                                  description: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              rows={3}
                            />
                          ) : (
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {aiTemplate?.description ||
                                predefinedTemplate?.description}
                            </p>
                          )}
                        </div>

                        {/* Key Features */}
                        <div>
                          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Key Features
                          </h3>
                          {isEditingTemplate ? (
                            <textarea
                              value={(editedTemplate?.features || []).join(
                                "\n",
                              )}
                              onChange={(e) =>
                                setEditedTemplate((prev) => ({
                                  ...prev,
                                  features: e.target.value
                                    .split("\n")
                                    .filter((f) => f.trim()),
                                }))
                              }
                              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              rows={3}
                              placeholder="Enter features (one per line)"
                            />
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {(
                                aiTemplate?.features ||
                                predefinedTemplate?.features ||
                                []
                              ).map((feature, i) => (
                                <span
                                  key={i}
                                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700"
                                >
                                  {feature}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Settings Section Marker */}
                        <div id="template-section-settings" className="scroll-mt-2" />
                        
                        {/* Voice Configuration — always from Step 2, never from AI template */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="text-xs text-blue-500 dark:text-blue-400 mb-1 font-medium">Gender</p>
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 capitalize">
                              {quickCreateData.gender || "Female"}
                            </p>
                          </div>
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="text-xs text-blue-500 dark:text-blue-400 mb-1 font-medium">Voice</p>
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                              {quickCreateData.voice || "Achernar"}
                            </p>
                          </div>
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="text-xs text-blue-500 dark:text-blue-400 mb-1 font-medium">Voice Speed</p>
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                              {quickCreateData.voiceSpeed?.toFixed(1) ?? "1.0"}x
                            </p>
                          </div>
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="text-xs text-blue-500 dark:text-blue-400 mb-1 font-medium">Voice Style</p>
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 capitalize">
                              {quickCreateData.voiceStyle || "Friendly"}
                            </p>
                          </div>
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="text-xs text-blue-500 dark:text-blue-400 mb-1 font-medium">Language</p>
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                              {quickCreateData.languages.length > 0
                                ? quickCreateData.languages.map((l) => ALL_LANGUAGES.find((al) => al.value === l)?.label || l).join(", ")
                                : "en-US"}
                            </p>
                          </div>
                          {aiTemplate && (
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Personality</p>
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                {aiTemplate.personality || "Professional"}
                              </p>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">✓ Voice settings are locked to your Step 2 selections</p>

                        {/* Tone and Industry Focus (both templates) */}
                        {(aiTemplate?.tone || aiTemplate?.industryFocus) && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                            {aiTemplate?.tone && (
                              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                                  Tone
                                </p>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                  {aiTemplate.tone}
                                </p>
                              </div>
                            )}
                            {aiTemplate?.industryFocus && (
                              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                                  Industry Focus
                                </p>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                  {aiTemplate.industryFocus}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* System Prompt Section Marker */}
                        <div id="template-section-system-prompt" className="scroll-mt-2" />

                        <div>
                          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                            System Prompt
                            {isGeneratingSystemPrompts &&
                              !spReadyTemplates.has(aiTemplate?.name ?? template?.name ?? '') && (
                                <span className="flex items-center gap-1.5 text-[10px] font-medium text-blue-500 dark:text-blue-400">
                                  <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                  Generating…
                                </span>
                              )}
                          </h3>
                          {isGeneratingSystemPrompts &&
                          !spReadyTemplates.has(aiTemplate?.name ?? template?.name ?? '') ? (
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-3">
                              <div className="w-8 h-8 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
                              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                                Crafting a detailed voice-optimized system prompt…
                              </p>
                            </div>
                          ) : (aiTemplate?.systemPrompt || template?.systemPrompt) ? (
                            isEditingTemplate ? (
                              <textarea
                                value={editedTemplate?.systemPrompt || ""}
                                onChange={(e) =>
                                  setEditedTemplate((prev) => ({
                                    ...prev,
                                    systemPrompt: e.target.value,
                                  }))
                                }
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                rows={16}
                              />
                            ) : (
                              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700 max-h-[40vh] overflow-y-auto">
                                <pre className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap font-sans">
                                  {aiTemplate?.systemPrompt || template?.systemPrompt}
                                </pre>
                              </div>
                            )
                          ) : null}
                        </div>
                        {/* First Message Section */}
                        {/* First Message Section Marker */}
                        <div id="template-section-first-message" className="scroll-mt-2" />
                        
                        {(aiTemplate?.firstMessage ||
                          template?.firstMessage) && (
                          <div>
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                              First Message
                            </h3>
                            {isEditingTemplate ? (
                              <textarea
                                value={editedTemplate?.firstMessage || ""}
                                onChange={(e) =>
                                  setEditedTemplate((prev) => ({
                                    ...prev,
                                    firstMessage: e.target.value,
                                  }))
                                }
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={3}
                              />
                            ) : (
                              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                                <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                                  "
                                  {replaceTemplatePlaceholders(aiTemplate?.firstMessage ||
                                    template?.firstMessage)}
                                  "
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Knowledge Section Marker */}
                        <div id="template-section-knowledge" className="scroll-mt-2" />
                        
                        {/* Manual Knowledge / Knowledge Base */}
                        {aiTemplate?.manualKnowledge && (
                          <div>
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                              Knowledge Base
                            </h3>
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700 max-h-48 overflow-y-auto">
                              <pre className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap font-sans">
                                {aiTemplate.manualKnowledge}
                              </pre>
                            </div>
                          </div>
                        )}

                        {/* Scripts Section Marker */}
                        <div id="template-section-scripts" className="scroll-mt-2" />
                        
                        {/* Divider for Call Scripts */}
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3">
                            Call Scripts
                          </h3>
                        </div>

                        {/* Call Scripts Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Key Talking Points */}
                          {(aiTemplate?.keyTalkingPoints ||
                            template?.keyTalkingPoints) && (
                            <div>
                              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Key Talking Points
                              </h3>
                              {isEditingTemplate ? (
                                <textarea
                                  value={editedTemplate?.keyTalkingPoints || ""}
                                  onChange={(e) =>
                                    setEditedTemplate((prev) => ({
                                      ...prev,
                                      keyTalkingPoints: e.target.value,
                                    }))
                                  }
                                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  rows={3}
                                />
                              ) : (
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700 max-h-40 overflow-y-auto">
                                  <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                                    {aiTemplate?.keyTalkingPoints ||
                                      template?.keyTalkingPoints}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Closing Script */}
                          {(aiTemplate?.closingScript ||
                            template?.closingScript) && (
                            <div>
                              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Closing Script
                              </h3>
                              {isEditingTemplate ? (
                                <textarea
                                  value={editedTemplate?.closingScript || ""}
                                  onChange={(e) =>
                                    setEditedTemplate((prev) => ({
                                      ...prev,
                                      closingScript: e.target.value,
                                    }))
                                  }
                                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  rows={3}
                                />
                              ) : (
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700 max-h-40 overflow-y-auto">
                                  <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                                    {aiTemplate?.closingScript ||
                                      template?.closingScript}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Training Section Marker */}
                        <div id="template-section-training" className="scroll-mt-2" />
                        
                        {/* Divider for Training Data */}
                        {(aiTemplate?.objections?.length ||
                          aiTemplate?.conversationExamples?.length ||
                          aiTemplate?.intents?.length) && (
                          <>
                            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3">
                                Training Data
                              </h3>
                            </div>

                            {/* Objections */}
                            {aiTemplate?.objections &&
                              aiTemplate.objections.length > 0 && (
                                <div>
                                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Objection Handling (
                                    {aiTemplate.objections.length})
                                  </h3>
                                  <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {aiTemplate.objections.map((obj, i) => (
                                      <div
                                        key={i}
                                        className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700"
                                      >
                                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                          "{obj.objection}"
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                          → {obj.response}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                            {/* Conversation Examples */}
                            {aiTemplate?.conversationExamples &&
                              aiTemplate.conversationExamples.length > 0 && (
                                <div>
                                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Conversation Examples (
                                    {aiTemplate.conversationExamples.length})
                                  </h3>
                                  <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {aiTemplate.conversationExamples.map(
                                      (example, i) => (
                                        <div
                                          key={i}
                                          className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700"
                                        >
                                          <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Customer: "{example.customerInput}"
                                          </p>
                                          <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Agent: "{example.expectedResponse}"
                                          </p>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}

                            {/* Intents */}
                            {aiTemplate?.intents &&
                              aiTemplate.intents.length > 0 && (
                                <div>
                                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Intent Training ({aiTemplate.intents.length}
                                    )
                                  </h3>
                                  <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {aiTemplate.intents.map((intent, i) => (
                                      <div
                                        key={i}
                                        className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700"
                                      >
                                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                          {intent.name}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                                          Phrases: {intent.phrases}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                          Response: {intent.response}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                          </>
                        )}

                        {/* Predefined Template Specific Sections */}
                        {predefinedTemplate && !aiTemplate && (
                          <>
                            {/* Industries & Processes */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                  Best For Industries
                                </h3>
                                <div className="flex flex-wrap gap-1.5">
                                  {predefinedTemplate.matchingIndustries.map(
                                    (industry, i) => (
                                      <span
                                        key={i}
                                        className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs capitalize border border-emerald-200 dark:border-emerald-800"
                                      >
                                        {industry === "all"
                                          ? "All Industries"
                                          : industry.replace("-", " ")}
                                      </span>
                                    ),
                                  )}
                                </div>
                              </div>

                              <div>
                                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                  Recommended For
                                </h3>
                                <div className="flex flex-wrap gap-1.5">
                                  {predefinedTemplate.matchingProcesses.map(
                                    (process, i) => (
                                      <span
                                        key={i}
                                        className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs capitalize border border-blue-200 dark:border-blue-800"
                                      >
                                        {process.replace("-", " ")}
                                      </span>
                                    ),
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Agent Settings */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                                  Persona
                                </p>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                  {predefinedTemplate.persona}
                                </p>
                              </div>
                              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                                  Guardrails
                                </p>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                  {predefinedTemplate.guardrailsLevel}
                                </p>
                              </div>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3">
                                Training Configuration
                              </h3>
                            </div>

                            {/* Custom Instructions */}
                            <div>
                              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Custom Instructions
                              </h3>
                              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700 max-h-20 overflow-y-auto">
                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                  {predefinedTemplate.customInstructions}
                                </p>
                              </div>
                            </div>

                            {/* First Message */}
                            <div>
                              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                First Message
                              </h3>
                              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                                <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                                  "{replaceTemplatePlaceholders(predefinedTemplate.firstMessage)}"
                                </p>
                              </div>
                            </div>

                            {/* Call Scripts */}
                            <div>
                              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Closing Script
                              </h3>
                              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700 max-h-24 overflow-y-auto">
                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                  {replaceTemplatePlaceholders(predefinedTemplate.closingScript)}
                                </p>
                              </div>
                            </div>

                            {/* Key Talking Points */}
                            <div>
                              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Key Talking Points
                              </h3>
                              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700 max-h-24 overflow-y-auto">
                                <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-line">
                                  {replaceTemplatePlaceholders(predefinedTemplate.keyTalkingPoints)}
                                </p>
                              </div>
                            </div>

                            {/* Objection Handling */}
                            <div>
                              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Objection Handling (
                                {predefinedTemplate.objections.length})
                              </h3>
                              <div className="space-y-2 max-h-32 overflow-y-auto">
                                {predefinedTemplate.objections.map((obj, i) => (
                                  <div
                                    key={i}
                                    className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700"
                                  >
                                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                      "{obj.objection}"
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                      → {obj.response}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Conversation Examples */}
                            <div>
                              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Conversation Examples (
                                {predefinedTemplate.conversationExamples.length}
                                )
                              </h3>
                              <div className="space-y-2 max-h-32 overflow-y-auto">
                                {predefinedTemplate.conversationExamples.map(
                                  (example, i) => (
                                    <div
                                      key={i}
                                      className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700"
                                    >
                                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Customer: "{example.customerInput}"
                                      </p>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Agent: "{example.expectedResponse}"
                                      </p>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>

                <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex-shrink-0">
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowTemplateDetails(false);
                        setIsEditingTemplate(false);
                        setEditedTemplate(null);
                      }}
                      className="flex-1 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      Close
                    </button>
                    {isEditingTemplate ? (
                      <button

                        onClick={() => {
                          if (editedTemplate) {
                            const templateIndex =
                              aiGeneratedTemplates.findIndex(
                                (t) => t.name === selectedTemplateForDetails,
                              );
                            if (templateIndex !== -1) {
                              const updated = [...aiGeneratedTemplates];
                              updated[templateIndex] = {
                                ...updated[templateIndex],
                                ...editedTemplate,
                              };
                              setAIGeneratedTemplates(updated);
                            }
                          }
                          setIsEditingTemplate(false);
                          setEditedTemplate(null);
                        }}
                        className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Save Changes
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setIsEditingTemplate(true);
                            const template =
                              aiGeneratedTemplates.find(
                                (t) => t.name === selectedTemplateForDetails,
                              ) ||
                              aiEmployeeTemplates[selectedTemplateForDetails];
                            setEditedTemplate(template || {});
                          }}
                          className="flex-1 py-2.5 border border-orange-300 dark:border-orange-600 rounded-xl text-orange-600 dark:text-orange-400 font-medium hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors flex items-center justify-center gap-2"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setQuickCreateData((prev) => ({
                              ...prev,
                              selectedTemplate: selectedTemplateForDetails,
                            }));
                            setShowTemplateDetails(false);
                          }}
                          className="flex-1 py-2.5 common-button-bg rounded-xl font-medium hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Select Template
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )}
      </div>
    );
  }


  // Fallback redirect if no route matched
  return <Navigate to="/agents" replace />;
};

export default AgentManagement;