import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../../components/GlassCard';
import appToast from '../../components/AppToast';
import { useAgent } from '../../contexts/AgentContext';
import { agentAPI } from '../../services/agentAPI';
import AgentPickerField from '../GoogleSheets/AgentPickerField';
import {
  getNumberCatalog,
  buyPhoneNumber,
  getPhoneNumbers,
  reassignPhoneNumber,
  deprovisionPhoneNumber,
  enableOutbound,
  setOutboundAgent,
  removeOutboundAgent,
  getDidTypes,
  createCampaign,
  updateCampaign,
  archiveCampaign,
  cloneCampaign,
  uploadCampaignContacts,
  startCampaign,
  scheduleCampaign,
  pauseCampaign,
  resumeCampaign,
  stopCampaign,
  deleteCampaign,
  getCampaigns,
  getCampaignStatus,
  getCampaignStatusDetail,
  getAllCampaignContacts,
  contactsToCsvFile,
  formatDid,
  buildCampaignScheduleConfig,
  priorityFromApi,
  workingDaysFromApi,
  placeDirectOutboundCall,
  isDirectCallCampaign,
  type CatalogNumber,
  type ProvisionedNumber,
  type Campaign,
  type CampaignLiveStatus,
  type CampaignContact,
  type DidType,
  type CreateCampaignRequest,
} from '../../services/phoneNumbersAPI';
import {
  listContacts,
  createContact,
  updateContact,
  archiveContact,
  type TenantContact,
} from '../../services/contactsAPI';
import CampaignScheduleForm, {
  defaultCampaignSchedule,
  type CampaignScheduleState,
} from './CampaignScheduleForm';
import RestartCampaignModal from './RestartCampaignModal';
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Plus,
  Trash2,
  Settings,
  CheckCircle,
  AlertCircle,
  Clock,
  Upload,
  Bot,
  Loader2,
  ChevronRight,
  Play,
  Pause,
  Hash,
  Mic,
  MicOff,
  PhoneCall,
  PhoneMissed,
  Users,
  Zap,
  Info,
  X,
  Check,
  ExternalLink,
  Square,
  Sparkles,
  FileSpreadsheet,
  Eye,
  Download,
  History,
  CopyPlus,
  Archive,
  Pencil,
  RotateCcw,
  MoreHorizontal,
  Mail,
  MessageCircle,
  Plug,
  BookUser,
  Search,
  BarChart3,
  CalendarClock,
  FileDown,
} from 'lucide-react';
import zohoIcon from '../../resources/Icon/zoho.svg';
import hubspotIcon from '../../resources/Icon/hubspot.svg';
import freshworkIcon from '../../resources/Icon/freshwork.svg';
import zendeskIcon from '../../resources/Icon/zendesk.svg';

const MAX_FREE_PHONE_NUMBERS = 1;
const SALES_EMAIL = 'hello@shivaitech.com';
const SALES_WHATSAPP_NUMBER = '919211490707';
const SALES_WHATSAPP_MESSAGE =
  'Hi ShivAI sales team, I want to purchase additional phone numbers on a premium plan. Please help me get started.';
const SALES_EMAIL_SUBJECT = 'Premium plan — additional phone numbers';

const CRM_CONNECTORS = [
  {
    id: 'zoho',
    name: 'Zoho CRM',
    description: 'Sync leads and contacts from Zoho for outbound campaigns',
    icon: zohoIcon,
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Pull qualified leads from HubSpot into your contact list',
    icon: hubspotIcon,
  },
  {
    id: 'freshworks',
    name: 'Freshworks',
    description: 'Import CRM contacts from Freshworks for calling',
    icon: freshworkIcon,
  },
  {
    id: 'zendesk',
    name: 'Zendesk Sell',
    description: 'Connect Zendesk Sell leads to AI outbound calls',
    icon: zendeskIcon,
  },
] as const;

interface FollowUpItem {
  id: string;
  agentId: string;
  agentName: string;
  phone: string;
  name: string;
  type: 'callback' | 'follow_up';
  summary: string;
  urgency?: string;
  createdAt?: string;
  callId?: string;
  source: 'lead' | 'contact';
}

const FOLLOW_UP_RE =
  /follow[\s-]?up|call[\s-]?back|callback|requested?\s+call|schedule(d)?\s+(a\s+)?call|ring[\s-]?back|call\s+again|return\s+call/i;

const isFollowUpSignal = (value: unknown): boolean => {
  if (value === true) return true;
  if (value == null) return false;
  if (typeof value === 'string' || typeof value === 'number') {
    return FOLLOW_UP_RE.test(String(value));
  }
  if (Array.isArray(value)) return value.some(isFollowUpSignal);
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).some(([k, v]) => {
      if (/callback|follow.?up|call.?back/i.test(k)) {
        if (v === true || v === 'true' || v === 1 || v === '1') return true;
        if (v != null && String(v).trim()) return true;
      }
      return isFollowUpSignal(v);
    });
  }
  return false;
};

const classifyFollowUpType = (text: string): 'callback' | 'follow_up' =>
  /call[\s-]?back|callback|ring[\s-]?back|return\s+call/i.test(text) ? 'callback' : 'follow_up';

const extractLeadField = (lead: any, patterns: RegExp[]): string => {
  const data = lead?.leadData;
  if (data && typeof data === 'object') {
    for (const [key, value] of Object.entries(data)) {
      if (patterns.some((re) => re.test(key)) && value != null && String(value).trim()) {
        return String(value).trim();
      }
    }
  }
  return '';
};

const leadToFollowUp = (lead: any, agentId: string, agentName: string): FollowUpItem | null => {
  const blob = [
    lead?.intent?.primary,
    lead?.intent?.details,
    ...(Array.isArray(lead?.intent?.tags) ? lead.intent.tags : []),
    lead?.leadData ? JSON.stringify(lead.leadData) : '',
  ]
    .filter(Boolean)
    .join(' ');
  if (!isFollowUpSignal(blob) && !isFollowUpSignal(lead?.leadData) && !isFollowUpSignal(lead?.intent)) {
    return null;
  }
  const phone =
    extractLeadField(lead, [/phone/, /mobile/, /contact/, /number/]) ||
    String(lead?.phone || lead?.phone_number || '').trim() ||
    '—';
  const name =
    extractLeadField(lead, [/^name$/, /full.?name/, /customer/, /contact.?name/]) ||
    'Unknown';
  const summary =
    String(lead?.intent?.primary || lead?.intent?.details || '').trim() ||
    'Follow-up or callback requested';
  return {
    id: String(lead?.id || lead?.callId || `${agentId}_${phone}_${lead?.createdAt || Date.now()}`),
    agentId,
    agentName,
    phone,
    name,
    type: classifyFollowUpType(blob),
    summary,
    urgency: lead?.intent?.urgency ? String(lead.intent.urgency) : undefined,
    createdAt: lead?.createdAt ? String(lead.createdAt) : undefined,
    callId: lead?.callId ? String(lead.callId) : undefined,
    source: 'lead',
  };
};

const downloadTextFile = (filename: string, content: string, mime = 'text/csv;charset=utf-8') => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const csvEscape = (value: unknown) => {
  const s = String(value ?? '');
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

// Common BCP-47 / agent language codes → display labels
const LANGUAGE_LABELS: Record<string, string> = {
  'en-US': 'English (US)',
  'en-GB': 'English (UK)',
  'en-AU': 'English (Australia)',
  'en-CA': 'English (Canada)',
  'en-IN': 'English (India)',
  'en-in': 'English (India)',
  en: 'English',
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  mr: 'Marathi',
  bn: 'Bengali',
  gu: 'Gujarati',
  kn: 'Kannada',
  ml: 'Malayalam',
  pa: 'Punjabi',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  nl: 'Dutch',
  pl: 'Polish',
  ru: 'Russian',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese',
  ar: 'Arabic',
};

const normalizeLangCode = (code: string) => {
  const t = code.trim();
  if (!t || t.toLowerCase() === 'multilingual' || t === 'text') return null;
  // Prefer canonical casing used by agents (en-IN, en-US)
  const m = t.match(/^([a-z]{2})-([a-z]{2})$/i);
  if (m) return `${m[1].toLowerCase()}-${m[2].toUpperCase()}`;
  return t.toLowerCase().length === 2 ? t.toLowerCase() : t;
};

const languageLabel = (code: string) =>
  LANGUAGE_LABELS[code] || LANGUAGE_LABELS[code.toLowerCase()] || code;

/** Pull available language codes from an agents API payload. */
const extractAgentLanguageOptions = (agent: {
  language?: string | string[];
  greeting_message?: Record<string, unknown>;
}): { value: string; label: string }[] => {
  const codes = new Set<string>();
  const raw = agent.language;
  if (Array.isArray(raw)) {
    raw.forEach((c) => {
      const n = typeof c === 'string' ? normalizeLangCode(c) : null;
      if (n) codes.add(n);
    });
  } else if (typeof raw === 'string' && raw.trim()) {
    // May be a single code or comma-separated
    raw.split(/[,|]/).forEach((c) => {
      const n = normalizeLangCode(c);
      if (n) codes.add(n);
    });
  }
  if (agent.greeting_message && typeof agent.greeting_message === 'object') {
    Object.keys(agent.greeting_message).forEach((k) => {
      const n = normalizeLangCode(k);
      if (n) codes.add(n);
    });
  }
  const list = Array.from(codes).map((value) => ({ value, label: languageLabel(value) }));
  if (list.length === 0) {
    return [{ value: 'en-IN', label: 'English (India)' }];
  }
  return list;
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface PhoneNumber {
  id: string;
  number: string;
  friendlyName: string;
  assignedAgentId: string | null;      // inbound answering agent (agent_id)
  outboundAgentId: string | null;      // agent that places outbound calls (outbound_agent_id)
  language: string;
  isActive: boolean;
  inboundEnabled: boolean;
  outboundEnabled: boolean;
  provisionedAt: string;
}

// Map an API record onto the shape this screen renders
const toPhoneNumber = (n: ProvisionedNumber): PhoneNumber => ({
  id: n._id,
  number: n.phone_number,
  friendlyName: n.display_name,
  assignedAgentId: n.agent_id || null,
  outboundAgentId: n.outbound_agent_id || null,
  language: n.language,
  isActive: n.is_active,
  inboundEnabled: n.inbound_enabled,
  outboundEnabled: !!n.outbound_enabled,
  provisionedAt: n.provisioned_at,
});

interface InboundRule {
  numberId: string;
  recordCalls: boolean;
  maxConcurrent: number;
  businessHours: { enabled: boolean; start: string; end: string; timezone: string };
  fallback: 'voicemail' | 'transfer' | 'busy';
  fallbackNumber?: string;
}

// Live status (total/pending/dialing/completed/no_answer) fetched per campaign
type CampaignRow = Campaign & { live?: CampaignLiveStatus };

interface ContactEntry {
  id: string;
  phone: string;
  name?: string;
  /** Why we're calling — previous inquiry, follow-up, etc. Sent as a custom field for the agent. */
  context?: string;
  /** Tenant contact id when selected from Contact List / API. */
  contactId?: string;
}

const TIMEZONES = [
  'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Asia/Tokyo',
  'Europe/London', 'Europe/Berlin', 'Europe/Paris',
  'America/New_York', 'America/Chicago', 'America/Los_Angeles',
  'Australia/Sydney', 'Pacific/Auckland',
];

const COUNTRY_CODES = [
  { id: 'IN',  code: '+91',  flag: '🇮🇳', name: 'India',           maxLen: 10 },
  { id: 'US',  code: '+1',   flag: '🇺🇸', name: 'United States',   maxLen: 10 },
  { id: 'CA',  code: '+1',   flag: '🇨🇦', name: 'Canada',          maxLen: 10 },
  { id: 'GB',  code: '+44',  flag: '🇬🇧', name: 'United Kingdom',  maxLen: 10 },
  { id: 'AU',  code: '+61',  flag: '🇦🇺', name: 'Australia',       maxLen: 9 },
  { id: 'AE',  code: '+971', flag: '🇦🇪', name: 'UAE',             maxLen: 9 },
  { id: 'SA',  code: '+966', flag: '🇸🇦', name: 'Saudi Arabia',    maxLen: 9 },
  { id: 'SG',  code: '+65',  flag: '🇸🇬', name: 'Singapore',       maxLen: 8 },
  { id: 'MY',  code: '+60',  flag: '🇲🇾', name: 'Malaysia',        maxLen: 10 },
  { id: 'PH',  code: '+63',  flag: '🇵🇭', name: 'Philippines',     maxLen: 10 },
  { id: 'PK',  code: '+92',  flag: '🇵🇰', name: 'Pakistan',        maxLen: 10 },
  { id: 'BD',  code: '+880', flag: '🇧🇩', name: 'Bangladesh',      maxLen: 10 },
  { id: 'LK',  code: '+94',  flag: '🇱🇰', name: 'Sri Lanka',       maxLen: 9 },
  { id: 'NP',  code: '+977', flag: '🇳🇵', name: 'Nepal',           maxLen: 10 },
  { id: 'DE',  code: '+49',  flag: '🇩🇪', name: 'Germany',         maxLen: 11 },
  { id: 'FR',  code: '+33',  flag: '🇫🇷', name: 'France',          maxLen: 9 },
  { id: 'IT',  code: '+39',  flag: '🇮🇹', name: 'Italy',           maxLen: 10 },
  { id: 'ES',  code: '+34',  flag: '🇪🇸', name: 'Spain',           maxLen: 9 },
  { id: 'NL',  code: '+31',  flag: '🇳🇱', name: 'Netherlands',     maxLen: 9 },
  { id: 'JP',  code: '+81',  flag: '🇯🇵', name: 'Japan',           maxLen: 10 },
  { id: 'KR',  code: '+82',  flag: '🇰🇷', name: 'South Korea',     maxLen: 10 },
  { id: 'CN',  code: '+86',  flag: '🇨🇳', name: 'China',           maxLen: 11 },
  { id: 'BR',  code: '+55',  flag: '🇧🇷', name: 'Brazil',          maxLen: 11 },
  { id: 'MX',  code: '+52',  flag: '🇲🇽', name: 'Mexico',          maxLen: 10 },
  { id: 'ZA',  code: '+27',  flag: '🇿🇦', name: 'South Africa',    maxLen: 9 },
  { id: 'NG',  code: '+234', flag: '🇳🇬', name: 'Nigeria',         maxLen: 10 },
  { id: 'KE',  code: '+254', flag: '🇰🇪', name: 'Kenya',           maxLen: 9 },
  { id: 'EG',  code: '+20',  flag: '🇪🇬', name: 'Egypt',           maxLen: 10 },
  { id: 'TR',  code: '+90',  flag: '🇹🇷', name: 'Turkey',          maxLen: 10 },
  { id: 'RU',  code: '+7',   flag: '🇷🇺', name: 'Russia',          maxLen: 10 },
];

/** Digits-only national number; strips pasted country code / leading 0s; enforces max length. */
const sanitizeNationalNumber = (raw: string, country: (typeof COUNTRY_CODES)[number]) => {
  let digits = String(raw || '').replace(/\D/g, '');
  const cc = country.code.replace('+', '');
  if (digits.startsWith(cc)) digits = digits.slice(cc.length);
  digits = digits.replace(/^0+/, '');
  return digits.slice(0, country.maxLen);
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const statusBadge = (status: string) => {
  const map: Record<string, { label: string; cls: string }> = {
    draft:     { label: 'Draft',     cls: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300' },
    scheduled: { label: 'Scheduled', cls: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300' },
    running:   { label: 'Running',   cls: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
    paused:    { label: 'Paused',    cls: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' },
    completed: { label: 'Completed', cls: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' },
    archived:  { label: 'Archived',  cls: 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300' },
    stopped:   { label: 'Stopped',   cls: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300' },
  };
  const s = map[status] || { label: status || 'Unknown', cls: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
};

// ─── Sub-component: Section Header ───────────────────────────────────────────

const SectionHeader: React.FC<{
  icon: React.ElementType;
  title: string;
  subtitle: string;
  color: string;
}> = ({ icon: Icon, title, subtitle, color }) => (
  <div className="flex items-center gap-4">
    <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center shadow-lg flex-shrink-0`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <h2 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
    </div>
  </div>
);

// ─── Toggle Switch ────────────────────────────────────────────────────────────

const Toggle: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={onChange}
    className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${
      checked ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
    }`}
  >
    <div
      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
        checked ? 'translate-x-5' : 'translate-x-0.5'
      }`}
    />
  </button>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const CallSetup: React.FC = () => {
  // Real agents from API via AgentContext
  const { agents, isLoading: agentsLoading, refreshAgents } = useAgent();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeSection, setActiveSection] = useState<
    'inbound' | 'outbound' | 'contacts' | 'connectors' | 'analytics' | 'followups'
  >(() => {
    const section = (location.state as { callSetupSection?: string } | null)?.callSetupSection;
    if (
      section === 'outbound' ||
      section === 'contacts' ||
      section === 'connectors' ||
      section === 'analytics' ||
      section === 'followups'
    ) {
      return section;
    }
    return 'inbound';
  });

  // Names for assigned agents missing from the context list (pagination / late load).
  const [resolvedAgentNames, setResolvedAgentNames] = useState<Record<string, string>>({});

  // ── Inbound state ──
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
  const [numbersLoading, setNumbersLoading] = useState(true);
  const [numbersError, setNumbersError] = useState<string | null>(null);
  const [assignModal, setAssignModal] = useState<PhoneNumber | null>(null);
  const [rulesModal, setRulesModal] = useState<PhoneNumber | null>(null);
  const [inboundRules, setInboundRules] = useState<Record<string, InboundRule>>({});
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [deprovisionTarget, setDeprovisionTarget] = useState<PhoneNumber | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // ── Buy-number state ──
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showPremiumContactModal, setShowPremiumContactModal] = useState(false);
  const [didTypes, setDidTypes] = useState<DidType[]>([]);
  const [selectedDidTypeId, setSelectedDidTypeId] = useState<number | null>(null);
  const [catalog, setCatalog] = useState<CatalogNumber[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [selectedDid, setSelectedDid] = useState<CatalogNumber | null>(null);
  const [buyDisplayName, setBuyDisplayName] = useState('');
  const [buyAgentId, setBuyAgentId] = useState('');
  const [isBuying, setIsBuying] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);

  // ── Enable-outbound state (per number) ──
  const [enablingOutboundId, setEnablingOutboundId] = useState<string | null>(null);

  // ── Outbound-agent assignment (modal, same UX as inbound assign) ──
  const [outboundAssignModal, setOutboundAssignModal] = useState<PhoneNumber | null>(null);
  const [outboundAgentSavingId, setOutboundAgentSavingId] = useState<string | null>(null);

  // ── Outbound / campaign state ──
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [campaignsError, setCampaignsError] = useState<string | null>(null);
  const [campaignActionId, setCampaignActionId] = useState<string | null>(null);
  const [deleteCampaignId, setDeleteCampaignId] = useState<string | null>(null);

  // ── Create-campaign wizard state ──
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [campaignStep, setCampaignStep] = useState<1 | 2 | 3>(1);
  const [contactMode, setContactMode] = useState<'single' | 'bulk' | 'file' | 'previous'>('single');
  const [bulkInput, setBulkInput] = useState('');
  const [singleContact, setSingleContact] = useState({ phone: '', name: '', context: '' });
  const [selectedCountryId, setSelectedCountryId] = useState('IN');
  const selectedCountry = COUNTRY_CODES.find((c) => c.id === selectedCountryId) ?? COUNTRY_CODES[0];
  const [campaignContacts, setCampaignContacts] = useState<ContactEntry[]>([]);
  const [contactFile, setContactFile] = useState<File | null>(null);
  const [previousContacts, setPreviousContacts] = useState<CampaignContact[]>([]);
  const [previousContactsLoading, setPreviousContactsLoading] = useState(false);
  const [previousContactsError, setPreviousContactsError] = useState<string | null>(null);
  const [previousContactSearch, setPreviousContactSearch] = useState('');
  const [selectedPreviousIds, setSelectedPreviousIds] = useState<Set<string>>(new Set());
  const [showContactFormModal, setShowContactFormModal] = useState(false);
  const [editingContact, setEditingContact] = useState<TenantContact | null>(null);
  const [contactFormBusy, setContactFormBusy] = useState(false);
  const [contactFormError, setContactFormError] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    phone: '',
    email: '',
    context: '',
    countryId: 'IN',
  });
  const [archiveContactTarget, setArchiveContactTarget] = useState<TenantContact | null>(null);
  const contactFormCountry =
    COUNTRY_CODES.find((c) => c.id === contactForm.countryId) ?? COUNTRY_CODES[0];
  const [isSavingCampaign, setIsSavingCampaign] = useState(false);
  const [wizardError, setWizardError] = useState<string | null>(null);
  const [wizardStage, setWizardStage] = useState<string>(''); // progress text while launching
  const [schedule, setSchedule] = useState<CampaignScheduleState>(defaultCampaignSchedule);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [restartCampaignTarget, setRestartCampaignTarget] = useState<CampaignRow | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showDirectCallModal, setShowDirectCallModal] = useState(false);
  const [outboundListTab, setOutboundListTab] = useState<'campaigns' | 'direct'>('campaigns');
  const [directCallMode, setDirectCallMode] = useState<'new' | 'list'>('new');
  const [directCallerNumberId, setDirectCallerNumberId] = useState('');
  const [directCountryId, setDirectCountryId] = useState('IN');
  const directCountry = COUNTRY_CODES.find((c) => c.id === directCountryId) ?? COUNTRY_CODES[0];
  const [directPhone, setDirectPhone] = useState('');
  const [directName, setDirectName] = useState('');
  const [directContext, setDirectContext] = useState('');
  const [directPhoneError, setDirectPhoneError] = useState<string | null>(null);
  const [directRecipients, setDirectRecipients] = useState<ContactEntry[]>([]);
  const [directSelectedIds, setDirectSelectedIds] = useState<Set<string>>(new Set());
  const [directContactSearch, setDirectContactSearch] = useState('');
  const [directCallBusy, setDirectCallBusy] = useState(false);
  const [directCallError, setDirectCallError] = useState<string | null>(null);
  const [phoneInputError, setPhoneInputError] = useState<string | null>(null);
  const [isGeneratingCampaignBrief, setIsGeneratingCampaignBrief] = useState(false);
  const [agentLanguageOptions, setAgentLanguageOptions] = useState<{ value: string; label: string }[]>([
    { value: 'en-IN', label: 'English (India)' },
  ]);
  const [agentLanguagesLoading, setAgentLanguagesLoading] = useState(false);
  const [showContactFileEditor, setShowContactFileEditor] = useState(false);
  const [contactFileEditText, setContactFileEditText] = useState('');
  const [contactFileEditLoading, setContactFileEditLoading] = useState(false);
  const [followUps, setFollowUps] = useState<FollowUpItem[]>([]);
  const [followUpsLoading, setFollowUpsLoading] = useState(false);
  const [followUpsError, setFollowUpsError] = useState<string | null>(null);
  const [followUpSearch, setFollowUpSearch] = useState('');
  const [followUpFilter, setFollowUpFilter] = useState<'all' | 'callback' | 'follow_up'>('all');
  const [agentPerfLoading, setAgentPerfLoading] = useState(false);
  const [agentSessionTotals, setAgentSessionTotals] = useState<Record<string, number>>({});
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    agentId: '',
    callerNumber: '',
    language: 'en-IN',
    objective: '',
    goal: '',
  });

  // ─── Inbound handlers ─────────────────────────────────────────────────────

  const loadNumbers = useCallback(async () => {
    setNumbersLoading(true);
    setNumbersError(null);
    try {
      const { data } = await getPhoneNumbers({ limit: 100 });
      setNumbers(data.map(toPhoneNumber));
    } catch (err: any) {
      setNumbersError(err.message || 'Failed to load phone numbers');
    } finally {
      setNumbersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNumbers();
  }, [loadNumbers]);

  // Ensure AgentContext loads on this page (also covered by pathname allowlist).
  useEffect(() => {
    if (agents.length === 0 && !agentsLoading) {
      refreshAgents().catch(() => {
        /* ignore — local resolve below still covers assigned IDs */
      });
    }
  }, [agents.length, agentsLoading, refreshAgents]);

  // Resolve inbound/outbound agent names when they are assigned but missing from context.
  useEffect(() => {
    const known = new Set(agents.map((a) => a.id));
    const missing = Array.from(
      new Set(
        numbers
          .flatMap((n) => [n.assignedAgentId, n.outboundAgentId])
          .filter((id): id is string => !!id && !known.has(id) && !resolvedAgentNames[id])
      )
    );
    if (missing.length === 0) return;

    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        missing.map(async (id) => {
          try {
            const { agent } = await agentAPI.getAgent(id);
            return [id, agent?.name || 'Assigned agent'] as const;
          } catch {
            return [id, 'Assigned agent'] as const;
          }
        })
      );
      if (cancelled) return;
      setResolvedAgentNames((prev) => {
        const next = { ...prev };
        for (const [id, name] of entries) next[id] = name;
        return next;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [numbers, agents, resolvedAgentNames]);

  const agentLabel = (agentId: string | null | undefined): string | null => {
    if (!agentId) return null;
    return agents.find((a) => a.id === agentId)?.name || resolvedAgentNames[agentId] || null;
  };

  // Reassignment rebuilds the LiveKit dispatch rule server-side
  const handleAssignAgent = async (agentId: string) => {
    if (!assignModal || !agentId) return;
    const target = assignModal;
    setAssigningId(target.id);
    setActionError(null);
    try {
      await reassignPhoneNumber(target.id, agentId);
      setNumbers((prev) =>
        prev.map((n) => (n.id === target.id ? { ...n, assignedAgentId: agentId } : n))
      );
      const agentName = agents.find((a) => a.id === agentId)?.name || 'agent';
      appToast.success(`${agentName} assigned to ${target.number}`);
      setAssignModal(null);
    } catch (err: any) {
      const msg = err.message || 'Failed to assign agent';
      setActionError(msg);
      appToast.error(msg);
    } finally {
      setAssigningId(null);
    }
  };

  // Detach the AI employee & reset the number (deprovision — tears down trunk +
  // dispatch rule; inbound stops routing and the agent is detached).
  const handleDeprovision = async (num: PhoneNumber) => {
    setReleasingId(num.id);
    setActionError(null);
    try {
      await deprovisionPhoneNumber(num.id);
      setNumbers((prev) =>
        prev.map((n) =>
          n.id === num.id
            ? { ...n, inboundEnabled: false, isActive: false, assignedAgentId: null, outboundEnabled: false, outboundAgentId: null }
            : n
        )
      );
      appToast.success(`AI employee detached from ${num.number}`);
      setDeprovisionTarget(null);
    } catch (err: any) {
      const msg = err.message || 'Failed to detach number';
      setActionError(msg);
      appToast.error(msg);
    } finally {
      setReleasingId(null);
    }
  };

  // ─── Buy-number handlers ──────────────────────────────────────────────────

  // Load the buyable catalog for a specific DID type (the API requires a type).
  const loadCatalog = async (didTypeId: number) => {
    setSelectedDid(null);
    setSelectedDidTypeId(didTypeId);
    setCatalogLoading(true);
    setCatalogError(null);
    try {
      setCatalog(await getNumberCatalog(didTypeId));
    } catch (err: any) {
      setCatalog([]);
      setCatalogError(err.message || 'Failed to load available numbers');
    } finally {
      setCatalogLoading(false);
    }
  };

  const openBuyModal = async () => {
    // Free plan: one number only — more requires contacting sales for premium.
    if (numbers.length >= MAX_FREE_PHONE_NUMBERS) {
      setShowPremiumContactModal(true);
      return;
    }
    setShowBuyModal(true);
    setSelectedDid(null);
    setBuyDisplayName('');
    setBuyAgentId('');
    setBuyError(null);
    setSelectedDidTypeId(null);
    setCatalog([]);
    setCatalogError(null);
    // A DID type is required before the catalog can be browsed. Load the types,
    // then auto-select the first buyable one and fetch its catalog.
    setCatalogLoading(true);
    try {
      const types = await getDidTypes();
      setDidTypes(types);
      const first = types.find((t) => !t.requires_request) || types[0];
      if (first) {
        await loadCatalog(first.id);
      } else {
        setCatalogLoading(false);
        setCatalogError('No number types are available right now.');
      }
    } catch (err: any) {
      setDidTypes([]);
      setCatalogLoading(false);
      setCatalogError(err.message || 'Failed to load number types');
    }
  };

  const handleBuyNumber = async () => {
    if (numbers.length >= MAX_FREE_PHONE_NUMBERS) {
      setShowBuyModal(false);
      setShowPremiumContactModal(true);
      return;
    }
    if (!selectedDid || !buyAgentId || !buyDisplayName.trim()) return;
    setIsBuying(true);
    setBuyError(null);
    try {
      const result = await buyPhoneNumber({
        voicelink_did_id: selectedDid.id,
        did_number: selectedDid.did_number,
        agent_id: buyAgentId,
        display_name: buyDisplayName.trim(),
      });
      setShowBuyModal(false);
      appToast.success(`${result?.phone_number || 'Number'} purchased & provisioned`);
      await loadNumbers();
    } catch (err: any) {
      const msg = err.message || 'Failed to provision number';
      setBuyError(msg);
      appToast.error(msg);
    } finally {
      setIsBuying(false);
    }
  };

  const handleSaveRules = (rule: InboundRule) => {
    setInboundRules((prev) => ({ ...prev, [rule.numberId]: rule }));
    setRulesModal(null);
    appToast.success('Routing rules saved');
  };

  // Enable outbound on a number so it can be used as a campaign caller
  const handleEnableOutbound = async (num: PhoneNumber) => {
    setEnablingOutboundId(num.id);
    setActionError(null);
    try {
      await enableOutbound(num.id);
      setNumbers((prev) =>
        prev.map((n) => (n.id === num.id ? { ...n, outboundEnabled: true } : n))
      );
      appToast.success(`Outbound enabled on ${num.number}`);
    } catch (err: any) {
      const msg = err.message || 'Failed to enable outbound calling';
      setActionError(msg);
      appToast.error(msg);
    } finally {
      setEnablingOutboundId(null);
    }
  };

  // Outbound-agent modal: empty value → remove agent (DELETE), otherwise set/replace.
  const handleOutboundAgentChange = async (agentId: string) => {
    if (!outboundAssignModal) return;
    const num = outboundAssignModal;
    setOutboundAgentSavingId(num.id);
    setActionError(null);
    try {
      if (agentId) {
        const updated = await setOutboundAgent(num.id, agentId);
        setNumbers((prev) =>
          prev.map((n) =>
            n.id === num.id ? { ...n, outboundAgentId: updated.outbound_agent_id || agentId } : n
          )
        );
        const agentName = agents.find((a) => a.id === agentId)?.name || 'agent';
        appToast.success(`Outbound agent set to ${agentName} for ${num.number}`);
        setOutboundAssignModal(null);
      } else {
        await removeOutboundAgent(num.id);
        setNumbers((prev) =>
          prev.map((n) => (n.id === num.id ? { ...n, outboundAgentId: null } : n))
        );
        appToast.success(`Outbound agent removed from ${num.number}`);
        setOutboundAssignModal(null);
      }
    } catch (err: any) {
      const msg = err.message || 'Failed to update outbound agent';
      setActionError(msg);
      appToast.error(msg);
    } finally {
      setOutboundAgentSavingId(null);
    }
  };

  // ─── Outbound handlers ────────────────────────────────────────────────────

  const handleAddSingleContact = () => {
    const digits = sanitizeNationalNumber(singleContact.phone, selectedCountry);
    if (!digits) {
      setPhoneInputError('Enter a phone number');
      return;
    }
    // Require full national length for the selected country
    if (digits.length !== selectedCountry.maxLen) {
      setPhoneInputError(`Enter a ${selectedCountry.maxLen}-digit number for ${selectedCountry.name}`);
      return;
    }
    setPhoneInputError(null);
    const fullPhone = `${selectedCountry.code}${digits}`;
    // Avoid duplicate adds
    if (campaignContacts.some((c) => c.phone === fullPhone)) {
      setPhoneInputError('This number is already in the list');
      return;
    }
    setCampaignContacts((prev) => [
      ...prev,
      {
        id: `c_${Date.now()}`,
        phone: fullPhone,
        name: singleContact.name.trim(),
        context: singleContact.context.trim() || undefined,
      },
    ]);
    setSingleContact({ phone: '', name: '', context: '' });
  };

  const parseBulkContacts = () => {
    const lines = bulkInput.split('\n').map((l) => l.trim()).filter(Boolean);
    const parsed: ContactEntry[] = lines.map((line, i) => {
      // phone, name, context — name and context optional
      const [phone, name = '', ...contextParts] = line.split(',').map((p) => p.trim());
      return {
        id: `c_${Date.now()}_${i}`,
        phone,
        name,
        context: contextParts.join(', ').trim() || undefined,
      };
    });
    setCampaignContacts(parsed);
  };

  const loadPreviousContacts = useCallback(async (search?: string) => {
    setPreviousContactsLoading(true);
    setPreviousContactsError(null);
    try {
      const result = await listContacts({
        page: 1,
        limit: 200,
        search: search?.trim() || undefined,
        include_inactive: false,
      });
      // Map tenant contacts into the CampaignContact-shaped list used by Direct Call / wizard.
      const mapped: CampaignContact[] = (result.data || []).map((c) => ({
        _id: c.id,
        campaign_id: '',
        phone_number: c.phone_number,
        name: c.name,
        status: c.is_active === false ? 'inactive' : 'active',
        custom_fields: c.custom_fields,
        created_at: c.created_at,
        updated_at: c.updated_at,
      }));
      setPreviousContacts(mapped);
    } catch (err: any) {
      setPreviousContacts([]);
      setPreviousContactsError(err.message || 'Failed to load contacts');
    } finally {
      setPreviousContactsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (showCreateCampaign && campaignStep === 2 && contactMode === 'previous') {
      loadPreviousContacts();
    }
  }, [showCreateCampaign, campaignStep, contactMode, loadPreviousContacts]);

  useEffect(() => {
    if (activeSection === 'contacts' || activeSection === 'analytics') {
      loadPreviousContacts(activeSection === 'contacts' ? previousContactSearch : undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- search debounced separately
  }, [activeSection, loadPreviousContacts]);

  useEffect(() => {
    if (activeSection !== 'contacts') return;
    const t = window.setTimeout(() => {
      loadPreviousContacts(previousContactSearch);
    }, 300);
    return () => window.clearTimeout(t);
  }, [previousContactSearch, activeSection, loadPreviousContacts]);

  useEffect(() => {
    if (!showDirectCallModal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showDirectCallModal]);

  const loadFollowUps = useCallback(async () => {
    setFollowUpsLoading(true);
    setFollowUpsError(null);
    try {
      const fromLeads = await Promise.all(
        agents.map(async (agent) => {
          try {
            const data = await agentAPI.getCallSummary(agent.id);
            const leads = Array.isArray(data?.leads) ? data.leads : Array.isArray(data) ? data : [];
            return leads
              .map((lead: any) => leadToFollowUp(lead, agent.id, agent.name))
              .filter(Boolean) as FollowUpItem[];
          } catch {
            return [] as FollowUpItem[];
          }
        })
      );

      // Also surface campaign contacts tagged as follow-up / callback in call_context
      let contactFollowUps: FollowUpItem[] = [];
      try {
        const result = await getAllCampaignContacts({ page: 1, limit: 200 });
        contactFollowUps = (result.data || [])
          .filter((c) => isFollowUpSignal(c.custom_fields?.call_context) || isFollowUpSignal(c.name))
          .map((c) => {
            const ctx = String(c.custom_fields?.call_context || '').trim();
            return {
              id: `contact_${c._id}`,
              agentId: '',
              agentName: 'Campaign contact',
              phone: c.phone_number || '—',
              name: c.name?.trim() || 'Unknown',
              type: classifyFollowUpType(ctx || c.name || ''),
              summary: ctx || 'Marked for follow-up in campaign contacts',
              createdAt: c.created_at || c.updated_at,
              source: 'contact' as const,
            };
          });
      } catch {
        // ignore — leads list alone is still useful
      }

      const merged = [...fromLeads.flat(), ...contactFollowUps];
      const seen = new Set<string>();
      const unique = merged.filter((item) => {
        const key = `${item.phone.replace(/\D/g, '')}|${item.type}|${item.summary.slice(0, 40)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      unique.sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      });
      setFollowUps(unique);
    } catch (err: any) {
      setFollowUps([]);
      setFollowUpsError(err.message || 'Failed to load follow-ups');
    } finally {
      setFollowUpsLoading(false);
    }
  }, [agents]);

  const loadAgentSessionTotals = useCallback(async () => {
    if (agents.length === 0) {
      setAgentSessionTotals({});
      return;
    }
    setAgentPerfLoading(true);
    try {
      const entries = await Promise.all(
        agents.map(async (agent) => {
          try {
            const data = await agentAPI.getAgentSessions('page=1&limit=1', agent.id);
            const total = Number(data?.pagination?.total) || Number(data?.sessions?.length) || 0;
            return [agent.id, total] as const;
          } catch {
            return [agent.id, agent.stats?.conversations || 0] as const;
          }
        })
      );
      setAgentSessionTotals(Object.fromEntries(entries));
    } finally {
      setAgentPerfLoading(false);
    }
  }, [agents]);

  useEffect(() => {
    if (activeSection === 'followups') {
      loadFollowUps();
    }
  }, [activeSection, loadFollowUps]);

  useEffect(() => {
    if (activeSection === 'analytics') {
      loadAgentSessionTotals();
    }
  }, [activeSection, loadAgentSessionTotals]);

  const filteredFollowUps = followUps.filter((item) => {
    if (followUpFilter !== 'all' && item.type !== followUpFilter) return false;
    const q = followUpSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      item.phone.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      item.agentName.toLowerCase().includes(q) ||
      item.summary.toLowerCase().includes(q)
    );
  });

  const buildAgentPerformanceRows = () =>
    agents.map((agent) => {
      const agentCampaigns = campaigns.filter((c) => c.agent_id === agent.id);
      const completed = agentCampaigns.reduce(
        (s, c) => s + (c.live?.completed || c.stats?.completed || 0),
        0
      );
      const pending = agentCampaigns.reduce(
        (s, c) => s + (c.live?.pending || c.stats?.pending || 0),
        0
      );
      const noAnswer = agentCampaigns.reduce(
        (s, c) => s + (c.live?.no_answer || c.stats?.no_answer || 0),
        0
      );
      const sessions = agentSessionTotals[agent.id] ?? agent.stats?.conversations ?? 0;
      const successRate = agent.stats?.successRate ?? 0;
      const attempted = completed + pending + noAnswer;
      const connectRate = attempted > 0 ? Math.round((completed / attempted) * 100) : 0;
      return {
        agent,
        sessions,
        successRate,
        avgResponseTime: agent.stats?.avgResponseTime ?? 0,
        campaigns: agentCampaigns.length,
        completed,
        pending,
        noAnswer,
        connectRate,
      };
    });

  const generateAnalyticsReport = () => {
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const agentRows = buildAgentPerformanceRows();
    const completedCalls = campaigns.reduce(
      (s, c) => s + (c.live?.completed || c.stats?.completed || 0),
      0
    );
    const pendingCalls = campaigns.reduce(
      (s, c) => s + (c.live?.pending || c.stats?.pending || 0),
      0
    );
    const noAnswerCalls = campaigns.reduce(
      (s, c) => s + (c.live?.no_answer || c.stats?.no_answer || 0),
      0
    );

    const lines: string[] = [
      ['Report', 'Call Setup Analytics'].map(csvEscape).join(','),
      ['Generated at', new Date().toLocaleString()].map(csvEscape).join(','),
      '',
      'Overview',
      ['Metric', 'Value'].join(','),
      ['Campaigns', campaigns.length].join(','),
      ['Phone numbers', numbers.length].join(','),
      ['Saved contacts', previousContacts.length].join(','),
      ['Completed calls', completedCalls].join(','),
      ['Pending calls', pendingCalls].join(','),
      ['Not answered', noAnswerCalls].join(','),
      ['Follow-ups listed', followUps.length].join(','),
      '',
      'Campaign breakdown',
      ['Name', 'Status', 'Completed', 'Pending', 'No answer', 'Agent ID'].map(csvEscape).join(','),
      ...campaigns.map((c) =>
        [
          c.name,
          c.status,
          c.live?.completed || c.stats?.completed || 0,
          c.live?.pending || c.stats?.pending || 0,
          c.live?.no_answer || c.stats?.no_answer || 0,
          c.agent_id || '',
        ]
          .map(csvEscape)
          .join(',')
      ),
      '',
      'Agent-wise performance',
      [
        'Agent',
        'Sessions',
        'Success rate %',
        'Avg response',
        'Campaigns',
        'Completed',
        'Pending',
        'No answer',
        'Connect rate %',
      ]
        .map(csvEscape)
        .join(','),
      ...agentRows.map((row) =>
        [
          row.agent.name,
          row.sessions,
          row.successRate,
          row.avgResponseTime,
          row.campaigns,
          row.completed,
          row.pending,
          row.noAnswer,
          row.connectRate,
        ]
          .map(csvEscape)
          .join(',')
      ),
    ];

    downloadTextFile(`call-setup-report-${stamp}.csv`, lines.join('\n'));
    appToast.success('Report downloaded');
  };

  const filteredPreviousContacts = previousContacts.filter((c) => {
    const q = previousContactSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      String(c.phone_number || '').toLowerCase().includes(q) ||
      String(c.name || '').toLowerCase().includes(q)
    );
  });

  const togglePreviousContact = (id: string) => {
    setSelectedPreviousIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllVisiblePrevious = () => {
    const ids = filteredPreviousContacts.map((c) => c._id);
    const allSelected = ids.length > 0 && ids.every((id) => selectedPreviousIds.has(id));
    setSelectedPreviousIds((prev) => {
      const next = new Set(prev);
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  };

  const addSelectedPreviousContacts = () => {
    const picked = previousContacts.filter((c) => selectedPreviousIds.has(c._id));
    if (picked.length === 0) {
      appToast.error('Select at least one previous contact');
      return;
    }
    setCampaignContacts((prev) => {
      const existing = new Set(prev.map((c) => c.phone.replace(/\D/g, '')));
      const additions: ContactEntry[] = [];
      for (const c of picked) {
        const phone = String(c.phone_number || '').trim();
        const key = phone.replace(/\D/g, '');
        if (!key || existing.has(key)) continue;
        existing.add(key);
        const context =
          c.custom_fields?.call_context ||
          c.custom_fields?.context ||
          c.custom_fields?.reason;
        additions.push({
          id: `prev_${c._id}`,
          phone,
          name: c.name || '',
          context: context || undefined,
        });
      }
      if (additions.length === 0) {
        appToast.error('Selected contacts are already in this campaign list');
        return prev;
      }
      appToast.success(`Added ${additions.length} previous contact${additions.length !== 1 ? 's' : ''}`);
      return [...prev, ...additions];
    });
    setSelectedPreviousIds(new Set());
  };

  // ─── Campaign list ────────────────────────────────────────────────────────

  const loadCampaigns = useCallback(async () => {
    setCampaignsLoading(true);
    setCampaignsError(null);
    try {
      const list = await getCampaigns();
      setCampaigns(list);
      // Fetch live stats per campaign; fall back to embedded campaign.stats
      const withStats = await Promise.all(
        list.map(async (c) => {
          try {
            return { ...c, live: await getCampaignStatus(c._id) };
          } catch {
            return { ...c, live: c.stats as CampaignLiveStatus | undefined };
          }
        })
      );
      setCampaigns(withStats);
    } catch (err: any) {
      setCampaignsError(err.message || 'Failed to load campaigns');
    } finally {
      setCampaignsLoading(false);
    }
  }, []);

  // Load campaigns the first time the user opens Outbound or Analytics
  useEffect(() => {
    if (
      (activeSection === 'outbound' || activeSection === 'analytics') &&
      campaigns.length === 0 &&
      !campaignsLoading
    ) {
      loadCampaigns();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection]);

  // Poll live status while any campaign is running (outbound or analytics view)
  useEffect(() => {
    if (activeSection !== 'outbound' && activeSection !== 'analytics') return;
    const anyRunning = campaigns.some((c) => c.status === 'running');
    if (!anyRunning) return;
    const t = setInterval(async () => {
      const running = campaigns.filter((c) => c.status === 'running');
      const updates = await Promise.all(
        running.map(async (c) => {
          try {
            return { id: c._id, live: await getCampaignStatus(c._id) };
          } catch {
            return null;
          }
        })
      );
      setCampaigns((prev) =>
        prev.map((c) => {
          const u = updates.find((x) => x && x.id === c._id);
          return u ? { ...c, live: u.live } : c;
        })
      );
    }, 5000);
    return () => clearInterval(t);
  }, [activeSection, campaigns]);

  const schedulePayload = (): Partial<CreateCampaignRequest> => ({
    max_concurrent: schedule.maxConcurrent,
    calls_per_minute: schedule.callsPerMinute,
    daily_limit: schedule.dailyLimit,
    priority: schedule.priority,
    timezone: schedule.timezone,
    recurrence: schedule.recurrence,
    window_start: schedule.windowStart,
    window_end: schedule.windowEnd,
    business_hours_start: schedule.windowStart,
    business_hours_end: schedule.windowEnd,
    working_days: schedule.workingDays,
    ...(schedule.endDate ? { end_date: schedule.endDate } : {}),
  });

  // Create / update → upload contacts → start now or schedule via dedicated APIs.
  const handleLaunchCampaign = async () => {
    if (!step1Valid || (!editingCampaignId && !step2Valid)) return;
    if (!schedule.startNow) {
      if (!schedule.scheduledAt) {
        setWizardError('Pick a date and time to schedule this campaign');
        return;
      }
      const when = new Date(schedule.scheduledAt);
      if (Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) {
        setWizardError('Scheduled time must be in the future');
        return;
      }
    }
    setIsSavingCampaign(true);
    setWizardError(null);
    try {
      const basePayload: CreateCampaignRequest = {
        agent_id: newCampaign.agentId,
        name: newCampaign.name.trim(),
        caller_number: newCampaign.callerNumber,
        language: newCampaign.language,
        ...(newCampaign.objective.trim() ? { objective: newCampaign.objective.trim() } : {}),
        ...(newCampaign.goal.trim() ? { goal: newCampaign.goal.trim() } : {}),
        ...schedulePayload(),
      };

      let campaignId = editingCampaignId;
      if (editingCampaignId) {
        setWizardStage('Saving campaign…');
        await updateCampaign(editingCampaignId, basePayload);
      } else {
        setWizardStage('Creating campaign…');
        const created = await createCampaign(basePayload);
        campaignId = created._id;
      }

      const shouldUpload =
        contactMode === 'file' ? !!contactFile : campaignContacts.length > 0;
      if (campaignId && shouldUpload) {
        setWizardStage('Uploading contacts…');
        const file =
          contactMode === 'file' && contactFile
            ? contactFile
            : contactsToCsvFile(
                campaignContacts.map((c) => ({
                  phone: c.phone,
                  name: c.name,
                  call_context: c.context,
                }))
              );
        const uploadResult = await uploadCampaignContacts(campaignId, file);
        if (uploadResult.uploaded > 0) {
          const sampleHint = uploadResult.sample?.[0]?.custom_fields
            ? ` · fields: ${Object.keys(uploadResult.sample[0].custom_fields).slice(0, 4).join(', ')}`
            : '';
          appToast.success(
            `Uploaded ${uploadResult.uploaded} contact${uploadResult.uploaded === 1 ? '' : 's'}${sampleHint}`
          );
        }
      }

      if (!editingCampaignId && campaignId) {
        if (schedule.startNow) {
          setWizardStage('Starting dialer…');
          const startResult = await startCampaign(campaignId);
          const pendingHint =
            typeof startResult.pending === 'number' ? ` · ${startResult.pending} pending` : '';
          appToast.success(`${startResult.message || 'Campaign started'}${pendingHint}`);

          try {
            const detail = await getCampaignStatusDetail(campaignId);
            if (detail.preflight_status === 'blocked' && detail.preflight_blockers?.length) {
              appToast.error(
                `Preflight blocked: ${detail.preflight_blockers.slice(0, 3).join(' · ')}`
              );
            }
          } catch {
            /* status poll is best-effort after start */
          }
        } else {
          setWizardStage('Scheduling campaign…');
          await scheduleCampaign(
            campaignId,
            buildCampaignScheduleConfig({
              startNow: false,
              scheduledAt: schedule.scheduledAt,
              endDate: schedule.endDate,
              timezone: schedule.timezone,
              recurrence: schedule.recurrence,
              windowStart: schedule.windowStart,
              windowEnd: schedule.windowEnd,
              workingDays: schedule.workingDays,
            })
          );
          appToast.success(`Campaign "${newCampaign.name.trim()}" scheduled`);
        }
      } else if (editingCampaignId && !schedule.startNow && campaignId) {
        setWizardStage('Updating schedule…');
        await scheduleCampaign(
          campaignId,
          buildCampaignScheduleConfig({
            startNow: false,
            scheduledAt: schedule.scheduledAt,
            endDate: schedule.endDate,
            timezone: schedule.timezone,
            recurrence: schedule.recurrence,
            windowStart: schedule.windowStart,
            windowEnd: schedule.windowEnd,
            workingDays: schedule.workingDays,
          })
        );
      }

      const name = newCampaign.name.trim();
      setShowCreateCampaign(false);
      resetCampaignForm();
      if (editingCampaignId) {
        appToast.success(`Campaign "${name}" updated`);
      } else if (schedule.startNow) {
        /* start toast already shown */
      } else {
        /* schedule toast already shown */
      }
      await loadCampaigns();
    } catch (err: any) {
      const msg = err.message || 'Failed to launch campaign';
      setWizardError(msg);
      appToast.error(msg);
    } finally {
      setIsSavingCampaign(false);
      setWizardStage('');
    }
  };

  const resetCampaignForm = () => {
    setCampaignStep(1);
    setCampaignContacts([]);
    setContactFile(null);
    setBulkInput('');
    setContactMode('single');
    setSingleContact({ phone: '', name: '', context: '' });
    setPreviousContacts([]);
    setPreviousContactsError(null);
    setPreviousContactSearch('');
    setSelectedPreviousIds(new Set());
    setSchedule(defaultCampaignSchedule());
    setEditingCampaignId(null);
    setPhoneInputError(null);
    setWizardError(null);
    setNewCampaign({ name: '', agentId: '', callerNumber: '', language: 'en-IN', objective: '', goal: '' });
    setAgentLanguageOptions([{ value: 'en-IN', label: 'English (India)' }]);
    setShowContactFileEditor(false);
    setContactFileEditText('');
  };

  const openCampaignWizard = () => {
    resetCampaignForm();
    setShowCreateCampaign(true);
  };

  const toLocalDateTimeValue = (iso?: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const openEditWizard = (campaign: CampaignRow, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setOpenMenuId(null);
    setEditingCampaignId(campaign._id);
    setCampaignStep(1);
    setNewCampaign({
      name: campaign.name,
      agentId: campaign.agent_id,
      callerNumber: campaign.caller_number,
      language: campaign.language || 'en-IN',
      objective: campaign.objective || '',
      goal: campaign.goal || '',
    });
    const sched = campaign.schedule;
    const startAt = sched?.start_at || campaign.scheduled_at;
    setSchedule({
      ...defaultCampaignSchedule(),
      startNow: !(startAt || campaign.status === 'scheduled'),
      scheduledAt: toLocalDateTimeValue(startAt),
      endDate: (sched?.end_at || campaign.end_date)
        ? String(sched?.end_at || campaign.end_date).slice(0, 10)
        : '',
      timezone: sched?.timezone || campaign.timezone || defaultCampaignSchedule().timezone,
      recurrence:
        ((sched?.recurrence || campaign.recurrence) as CampaignScheduleState['recurrence']) || 'none',
      windowStart:
        sched?.daily_start ||
        campaign.window_start ||
        campaign.business_hours_start ||
        '09:00',
      windowEnd:
        sched?.daily_end || campaign.window_end || campaign.business_hours_end || '18:00',
      workingDays: workingDaysFromApi(
        (sched?.working_days || campaign.working_days) as Array<string | number> | undefined
      ),
      maxConcurrent: campaign.max_concurrent || 3,
      callsPerMinute: campaign.calls_per_minute || 10,
      dailyLimit: campaign.daily_limit || 100,
      priority: priorityFromApi(campaign.priority),
    });
    setShowCreateCampaign(true);
  };

  // Load languages available on the selected outbound agent
  useEffect(() => {
    if (!newCampaign.agentId) {
      setAgentLanguageOptions([{ value: 'en-IN', label: 'English (India)' }]);
      setAgentLanguagesLoading(false);
      return;
    }
    let cancelled = false;
    setAgentLanguagesLoading(true);
    (async () => {
      try {
        const { agent } = await agentAPI.getAgent(newCampaign.agentId);
        if (cancelled) return;
        const opts = extractAgentLanguageOptions(agent);
        setAgentLanguageOptions(opts);
        setNewCampaign((p) => {
          const match = opts.find(
            (o) => o.value.toLowerCase() === (p.language || '').toLowerCase()
          );
          return { ...p, language: match?.value || opts[0].value };
        });
      } catch (err) {
        console.warn('Failed to load agent languages:', err);
        if (!cancelled) {
          setAgentLanguageOptions([{ value: 'en-IN', label: 'English (India)' }]);
        }
      } finally {
        if (!cancelled) setAgentLanguagesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [newCampaign.agentId]);

  const isContactFileCsv = !!contactFile && /\.csv$/i.test(contactFile.name);

  const openContactFileEditor = async () => {
    if (!contactFile) return;
    setShowContactFileEditor(true);
    if (!isContactFileCsv) {
      setContactFileEditText('');
      return;
    }
    setContactFileEditLoading(true);
    try {
      const text = await contactFile.text();
      setContactFileEditText(text);
    } catch {
      appToast.error('Could not read file contents');
      setShowContactFileEditor(false);
    } finally {
      setContactFileEditLoading(false);
    }
  };

  const saveContactFileEdits = () => {
    if (!contactFile || !isContactFileCsv) return;
    const updated = new File([contactFileEditText], contactFile.name, {
      type: contactFile.type || 'text/csv',
    });
    setContactFile(updated);
    setShowContactFileEditor(false);
    appToast.success('File updated');
  };

  const downloadContactFile = () => {
    if (!contactFile) return;
    const url = URL.createObjectURL(contactFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = contactFile.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateCampaignBriefWithAI = async () => {
    const agent = agents.find((a) => a.id === newCampaign.agentId);
    if (!agent) {
      appToast.error('Select an agent number (with an outbound agent) first');
      return;
    }

    setIsGeneratingCampaignBrief(true);
    try {
      const template = agent.template;
      const promptText = `You write outbound campaign briefs for a voice AI agent. Based on this agent's template and instructions, produce objective and goal text for an outbound call campaign.

AGENT
- Name: ${agent.name}
- Persona: ${agent.persona || 'Professional'}
- Template: ${template?.name || 'General'}
- Template description: ${template?.description || 'N/A'}
- Key talking points: ${template?.keyTalkingPoints || 'N/A'}
- Opening / first message: ${template?.firstMessage || template?.openingScript || 'N/A'}
- Custom instructions: ${agent.custom_instructions || 'N/A'}
${newCampaign.name.trim() ? `- Campaign name hint: ${newCampaign.name.trim()}` : ''}

STYLE REQUIREMENTS (match this structure and depth — adapt content to THIS agent/industry, do not copy cinema franchise wording):
- Goal: one clear paragraph describing what the call should achieve (qualify, answer questions, move to next step). Sound consultative, not pushy.
- Objective: a bullet list (each line starting with "• ") of concrete call steps — reconnect/confirm interest, gather requirements, explain offering, handle concerns, qualify, schedule next step.
- Optionally weave in short call-context guidance (warm vs cold, tone) inside the objective bullets or as a short preface line before the bullets.

Return ONLY valid JSON (no markdown fences):
{"goal":"...","objective":"..."}

goal = the Goal paragraph.
objective = the Objective bullet list (use \\n between bullets).`;

      const response = await agentAPI.generatePrompt(promptText);
      const generated =
        response?.data?.generation?.response ||
        response?.generation?.response ||
        response?.response;

      if (!generated || typeof generated !== 'string') {
        throw new Error('Invalid AI response');
      }

      let goal = '';
      let objective = '';
      try {
        const jsonMatch = generated.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : generated);
        goal = String(parsed.goal || '').trim();
        objective = String(parsed.objective || '').trim();
      } catch {
        // Fallback: split on ## Goal / ## Objective style headings if JSON parse fails
        const goalMatch = generated.match(/##\s*Goal\s*([\s\S]*?)(?=##\s*Objective|$)/i);
        const objMatch = generated.match(/##\s*Objective\s*([\s\S]*?)(?=##\s*Call Context|##\s*AI Personality|$)/i);
        goal = (goalMatch?.[1] || '').trim();
        objective = (objMatch?.[1] || generated).trim();
      }

      if (!goal && !objective) {
        throw new Error('Could not parse objective/goal from AI response');
      }

      setNewCampaign((p) => ({
        ...p,
        goal: goal || p.goal,
        objective: objective || p.objective,
      }));
      appToast.success('Objective & goal generated from agent template');
    } catch (err: any) {
      console.error('Failed to generate campaign brief:', err);
      appToast.error(err.message || 'Failed to generate with AI. Please try again.');
    } finally {
      setIsGeneratingCampaignBrief(false);
    }
  };

  // Start (draft) / pause / resume / stop / restart / archive / delete / duplicate / clone
  const handleCampaignAction = async (
    id: string,
    action: 'pause' | 'resume' | 'start' | 'stop' | 'delete' | 'archive' | 'clone',
    e?: React.MouseEvent
  ) => {
    e?.stopPropagation();
    setOpenMenuId(null);
    setCampaignActionId(id);
    setCampaignsError(null);
    try {
      if (action === 'pause') {
        const result = await pauseCampaign(id);
        setCampaigns((prev) => prev.map((c) => (c._id === id ? { ...c, status: 'paused' } : c)));
        appToast.success(result.message || 'Campaign paused');
      } else if (action === 'resume') {
        const result = await resumeCampaign(id);
        setCampaigns((prev) => prev.map((c) => (c._id === id ? { ...c, status: 'running' } : c)));
        appToast.success(result.message || 'Campaign resumed');
      } else if (action === 'start') {
        const result = await startCampaign(id);
        setCampaigns((prev) => prev.map((c) => (c._id === id ? { ...c, status: 'running' } : c)));
        const pendingHint =
          typeof result.pending === 'number' ? ` · ${result.pending} pending` : '';
        appToast.success(`${result.message || 'Campaign started'}${pendingHint}`);
        try {
          const detail = await getCampaignStatusDetail(id);
          if (detail.preflight_status === 'blocked' && detail.preflight_blockers?.length) {
            appToast.error(`Preflight blocked: ${detail.preflight_blockers.slice(0, 3).join(' · ')}`);
          }
        } catch {
          /* ignore */
        }
      } else if (action === 'stop') {
        const result = await stopCampaign(id);
        setCampaigns((prev) => prev.map((c) => (c._id === id ? { ...c, status: 'stopped' } : c)));
        appToast.success(result.message || 'Campaign stopped');
      } else if (action === 'archive') {
        await archiveCampaign(id);
        setCampaigns((prev) => prev.map((c) => (c._id === id ? { ...c, status: 'archived' } : c)));
        appToast.success('Campaign archived');
      } else if (action === 'clone') {
        const copy = await cloneCampaign(id);
        appToast.success(`Cloned settings as "${copy.name}"`);
        await loadCampaigns();
      } else if (action === 'delete') {
        await deleteCampaign(id);
        setCampaigns((prev) => prev.filter((c) => c._id !== id));
        appToast.success('Campaign deleted');
        setDeleteCampaignId(null);
      }
    } catch (err: any) {
      const msg = err.message || `Failed to ${action} campaign`;
      setCampaignsError(msg);
      appToast.error(msg);
    } finally {
      setCampaignActionId(null);
    }
  };

  // ─── Derived ─────────────────────────────────────────────────────────────

  // All active numbers — shown in the outbound tab so users can enable + assign
  const outboundEligibleNumbers = numbers.filter((n) => n.isActive);
  // Campaign-ready numbers: outbound enabled AND an outbound agent already set.
  // The campaign uses that number's outbound agent — no separate agent choice.
  const campaignCallerNumbers = numbers.filter(
    (n) => n.outboundEnabled && n.isActive && n.outboundAgentId
  );
  const selectedCallerNum = campaignCallerNumbers.find((n) => n.number === newCampaign.callerNumber);
  const assignedCount = numbers.filter((n) => n.assignedAgentId).length;
  const step1Valid = !!(newCampaign.name.trim() && newCampaign.callerNumber && newCampaign.agentId);
  const step2Valid = editingCampaignId
    ? true
    : contactMode === 'file'
      ? !!contactFile
      : campaignContacts.length > 0;

  const regularCampaigns = campaigns.filter((c) => !isDirectCallCampaign(c));
  const directCallCampaigns = campaigns.filter((c) => isDirectCallCampaign(c));
  const outboundDisplayedCampaigns =
    outboundListTab === 'direct' ? directCallCampaigns : regularCampaigns;

  const resetDirectCallForm = () => {
    setDirectCallMode('new');
    setDirectCallerNumberId(campaignCallerNumbers[0]?.id || '');
    setDirectCountryId('IN');
    setDirectPhone('');
    setDirectName('');
    setDirectContext('');
    setDirectPhoneError(null);
    setDirectRecipients([]);
    setDirectSelectedIds(new Set());
    setDirectContactSearch('');
    setDirectCallError(null);
  };

  const openDirectCallModal = () => {
    resetDirectCallForm();
    setShowDirectCallModal(true);
    loadPreviousContacts();
  };

  const filteredDirectContacts = previousContacts.filter((c) => {
    const q = directContactSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      String(c.phone_number || '').toLowerCase().includes(q) ||
      String(c.name || '').toLowerCase().includes(q)
    );
  });

  const addDirectRecipient = (entry: Omit<ContactEntry, 'id'> & { id?: string }) => {
    const phone = String(entry.phone || '').trim();
    if (!phone) return false;
    if (
      directRecipients.some(
        (r) => r.phone === phone || (entry.contactId && r.contactId === entry.contactId)
      )
    ) {
      setDirectCallError('This number is already in the call list');
      return false;
    }
    setDirectRecipients((prev) => [
      ...prev,
      {
        id: entry.id || `dc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        phone,
        name: entry.name?.trim() || undefined,
        context: entry.context?.trim() || undefined,
        contactId: entry.contactId,
      },
    ]);
    setDirectCallError(null);
    return true;
  };

  const handleAddDirectNewContact = () => {
    const digits = sanitizeNationalNumber(directPhone, directCountry);
    if (!digits) {
      setDirectPhoneError('Enter a phone number');
      return;
    }
    if (digits.length !== directCountry.maxLen) {
      setDirectPhoneError(`Enter a ${directCountry.maxLen}-digit number for ${directCountry.name}`);
      return;
    }
    setDirectPhoneError(null);
    const ok = addDirectRecipient({
      phone: `${directCountry.code}${digits}`,
      name: directName.trim() || undefined,
      context: directContext.trim() || undefined,
    });
    if (ok) {
      setDirectPhone('');
      setDirectName('');
      setDirectContext('');
    }
  };

  const handleToggleDirectListContact = (contact: CampaignContact) => {
    const phone = String(contact.phone_number || '').trim();
    if (!phone) return;

    const alreadyQueued = directRecipients.some(
      (r) => r.phone === phone || r.id === contact._id || r.contactId === contact._id
    );
    if (alreadyQueued) {
      setDirectRecipients((prev) =>
        prev.filter((r) => r.phone !== phone && r.id !== contact._id && r.contactId !== contact._id)
      );
      setDirectSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(contact._id);
        return next;
      });
      return;
    }

    addDirectRecipient({
      id: contact._id,
      contactId: contact._id,
      phone,
      name: String(contact.name || '').trim() || undefined,
      context:
        String(contact.custom_fields?.call_context || contact.custom_fields?.context || '').trim() ||
        undefined,
    });
    setDirectSelectedIds((prev) => new Set(prev).add(contact._id));
  };

  const updateDirectRecipient = (id: string, patch: Partial<Pick<ContactEntry, 'name' | 'context'>>) => {
    setDirectRecipients((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
  };

  const removeDirectRecipient = (id: string) => {
    setDirectRecipients((prev) => {
      const removed = prev.find((r) => r.id === id);
      if (removed) {
        setDirectSelectedIds((sel) => {
          const next = new Set(sel);
          next.delete(removed.id);
          // also clear if matched by list id stored as id
          return next;
        });
      }
      return prev.filter((r) => r.id !== id);
    });
  };

  const handlePlaceDirectCall = async () => {
    const caller = campaignCallerNumbers.find((n) => n.id === directCallerNumberId);
    if (!caller?.outboundAgentId) {
      setDirectCallError('Select an outbound-ready number with an assigned agent');
      return;
    }

    // Allow placing with draft fields filled if queue is empty (single quick add)
    let recipients = [...directRecipients];
    if (recipients.length === 0 && directCallMode === 'new' && directPhone.trim()) {
      const digits = sanitizeNationalNumber(directPhone, directCountry);
      if (!digits) {
        setDirectPhoneError('Enter a phone number');
        setDirectCallError('Enter a phone number');
        return;
      }
      if (digits.length !== directCountry.maxLen) {
        const msg = `Enter a ${directCountry.maxLen}-digit number for ${directCountry.name}`;
        setDirectPhoneError(msg);
        setDirectCallError(msg);
        return;
      }
      recipients = [
        {
          id: `dc_draft`,
          phone: `${directCountry.code}${digits}`,
          name: directName.trim() || undefined,
          context: directContext.trim() || undefined,
        },
      ];
    }

    if (recipients.length === 0) {
      setDirectCallError(
        directCallMode === 'list'
          ? 'Select at least one contact from the list'
          : 'Add at least one phone number'
      );
      return;
    }

    setDirectCallBusy(true);
    setDirectCallError(null);
    try {
      const result = await placeDirectOutboundCall({
        phone_number_id: caller.id,
        caller_number: caller.number,
        agent_id: caller.outboundAgentId,
        language: caller.language || 'en-in',
        recipients: recipients.map((r) => ({
          to: r.phone,
          name: r.name,
          call_context: r.context,
          contact_id: r.contactId,
        })),
      });
      const count = result.recipient_count || recipients.length;
      appToast.success(
        result.message || (count > 1 ? `Calling ${count} contacts…` : `Calling ${recipients[0].phone}…`)
      );
      setShowDirectCallModal(false);
      resetDirectCallForm();
      setOutboundListTab('direct');
      if (result.campaign_id || result.batch_id) {
        await loadCampaigns();
      }
      await loadPreviousContacts();
    } catch (err: any) {
      const msg = err.message || 'Failed to place direct call';
      setDirectCallError(msg);
      appToast.error(msg);
    } finally {
      setDirectCallBusy(false);
    }
  };

  const openCreateContactModal = () => {
    setEditingContact(null);
    setContactForm({ name: '', phone: '', email: '', context: '', countryId: 'IN' });
    setContactFormError(null);
    setShowContactFormModal(true);
  };

  const openEditContactModal = (c: CampaignContact) => {
    const phone = String(c.phone_number || '');
    const match = COUNTRY_CODES.find((cc) => phone.startsWith(cc.code));
    const national = match ? phone.slice(match.code.length) : phone.replace(/^\+/, '');
    setEditingContact({
      id: c._id,
      name: c.name || '',
      phone_number: c.phone_number,
      custom_fields: c.custom_fields,
      is_active: c.status !== 'inactive',
    });
    setContactForm({
      name: c.name || '',
      phone: national,
      email: '',
      context: String(c.custom_fields?.call_context || c.custom_fields?.context || ''),
      countryId: match?.id || 'IN',
    });
    setContactFormError(null);
    setShowContactFormModal(true);
  };

  const handleSaveContactForm = async () => {
    const name = contactForm.name.trim();
    if (!name) {
      setContactFormError('Name is required');
      return;
    }

    let phoneE164 = editingContact?.phone_number || '';
    if (!editingContact) {
      const digits = sanitizeNationalNumber(contactForm.phone, contactFormCountry);
      if (!digits) {
        setContactFormError('Enter a phone number');
        return;
      }
      if (digits.length !== contactFormCountry.maxLen) {
        setContactFormError(
          `Enter a ${contactFormCountry.maxLen}-digit number for ${contactFormCountry.name}`
        );
        return;
      }
      phoneE164 = `${contactFormCountry.code}${digits}`;
    }

    const custom_fields: Record<string, string> = {};
    if (contactForm.context.trim()) custom_fields.call_context = contactForm.context.trim();

    setContactFormBusy(true);
    setContactFormError(null);
    try {
      if (editingContact) {
        await updateContact(editingContact.id, {
          name,
          ...(contactForm.email.trim() ? { email: contactForm.email.trim() } : {}),
          ...(Object.keys(custom_fields).length ? { custom_fields } : {}),
        });
        appToast.success('Contact updated');
      } else {
        const caller = campaignCallerNumbers[0];
        await createContact({
          name,
          phone_number: phoneE164,
          direction: 'both',
          ...(contactForm.email.trim() ? { email: contactForm.email.trim() } : {}),
          ...(caller?.outboundAgentId ? { agent_id: caller.outboundAgentId } : {}),
          ...(caller?.id ? { phone_number_id: caller.id } : {}),
          ...(Object.keys(custom_fields).length ? { custom_fields } : {}),
        });
        appToast.success('Contact created');
      }
      setShowContactFormModal(false);
      await loadPreviousContacts(previousContactSearch);
    } catch (err: any) {
      setContactFormError(err.message || 'Failed to save contact');
    } finally {
      setContactFormBusy(false);
    }
  };

  const handleArchiveContact = async () => {
    if (!archiveContactTarget) return;
    setContactFormBusy(true);
    try {
      await archiveContact(archiveContactTarget.id);
      appToast.success('Contact archived');
      setArchiveContactTarget(null);
      await loadPreviousContacts(previousContactSearch);
    } catch (err: any) {
      appToast.error(err.message || 'Failed to archive contact');
    } finally {
      setContactFormBusy(false);
    }
  };

  const queueContactForDirectCall = (c: CampaignContact) => {
    resetDirectCallForm();
    setDirectCallMode('list');
    setDirectRecipients([
      {
        id: c._id,
        contactId: c._id,
        phone: c.phone_number,
        name: c.name,
        context: String(c.custom_fields?.call_context || c.custom_fields?.context || ''),
      },
    ]);
    setDirectSelectedIds(new Set([c._id]));
    setShowDirectCallModal(true);
    loadPreviousContacts();
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* Top bar: title + section toggle */}
      <GlassCard>
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Call Setup - In/Outbound</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Manage inbound routing, outbound campaigns, contacts, CRM connectors, follow-ups, and analytics
            </p>
          </div>
          <div className="flex flex-wrap gap-1 common-bg-icons rounded-xl p-1 self-start sm:self-auto">
            {([
              { id: 'inbound', label: 'Inbound', icon: PhoneIncoming },
              { id: 'outbound', label: 'Outbound', icon: PhoneOutgoing },
              { id: 'contacts', label: 'Contact List', icon: BookUser },
              { id: 'connectors', label: 'CRM Connector', icon: Plug },
              { id: 'followups', label: 'Follow-ups', icon: CalendarClock },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            ] as const).map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeSection === s.id
                    ? 'common-button-bg2 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <s.icon className="w-4 h-4" />
                <span className="whitespace-nowrap">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      <AnimatePresence mode="wait">

        {/* ══════════════════════════════════════════════════════════════════
            INBOUND
           ══════════════════════════════════════════════════════════════════ */}
        {activeSection === 'inbound' && (
          <motion.div
            key="inbound"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 sm:space-y-6"
          >
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              {[
                { label: 'Phone Numbers', value: numbers.length,                    icon: Hash,         color: 'from-blue-500 to-indigo-600'   },
                { label: 'Assigned',      value: assignedCount,                     icon: Bot,          color: 'from-emerald-500 to-teal-600'  },
                { label: 'Unassigned',    value: numbers.length - assignedCount,    icon: AlertCircle,  color: 'from-amber-500 to-orange-600'  },
              ].map((stat) => (
                <GlassCard key={stat.label}>
                  <div className="p-2 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:gap-3">
                    <div className={`hidden sm:flex w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} items-center justify-center flex-shrink-0`}>
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                    {/* Mobile: coloured dot + number + label stacked */}
                    <div className={`sm:hidden w-6 h-6 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-1`}>
                      <stat.icon className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white leading-tight">{stat.value}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">{stat.label}</p>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>

            {/* Number List */}
            <GlassCard>
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                  <SectionHeader
                    icon={PhoneIncoming}
                    title="Phone Numbers"
                    subtitle="Assign AI agents to handle inbound calls on each number"
                    color="bg-gradient-to-br from-blue-500 to-indigo-600"
                  />
                  <button
                    onClick={openBuyModal}
                    className="common-button-bg flex items-center gap-2 flex-shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    {numbers.length >= MAX_FREE_PHONE_NUMBERS ? 'Buy More Numbers' : 'Buy Number'}
                  </button>
                </div>

                {actionError && (
                  <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600 dark:text-red-400 flex-1">{actionError}</p>
                    <button onClick={() => setActionError(null)} className="text-red-400 hover:text-red-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Loading */}
                {numbersLoading && (
                  <div className="flex items-center justify-center py-14 gap-2 text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Loading your numbers…</span>
                  </div>
                )}

                {/* Load error */}
                {!numbersLoading && numbersError && (
                  <div className="text-center py-12 border-2 border-dashed border-red-200 dark:border-red-800 rounded-2xl">
                    <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-3">
                      <AlertCircle className="w-6 h-6 text-red-500" />
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{numbersError}</p>
                    <button onClick={loadNumbers} className="common-button-bg2 inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl">
                      Try again
                    </button>
                  </div>
                )}

                {/* Empty */}
                {!numbersLoading && !numbersError && numbers.length === 0 && (
                  <div className="text-center py-14 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center mx-auto mb-4">
                      <Phone className="w-7 h-7 text-blue-500" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-2">No phone numbers yet</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
                      Buy a number to start receiving inbound calls. It goes live the moment it's provisioned.
                    </p>
                    <button onClick={openBuyModal} className="common-button-bg inline-flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Buy Number
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  {!numbersLoading && !numbersError && numbers.map((num) => {
                    const agentName = agentLabel(num.assignedAgentId);
                    const rules = inboundRules[num.id];
                    return (
                      <div
                        key={num.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-xl common-bg-icons gap-2 sm:gap-3"
                      >
                        {/* Number info */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                            <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 dark:text-white text-sm">{num.number}</p>
                            <div className="flex flex-wrap items-center gap-1 mt-0.5">
                              <span className="text-xs text-slate-500 dark:text-slate-400">{num.friendlyName}</span>
                              {num.inboundEnabled && num.isActive ? (
                                <span className="text-xs bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded-md">Live</span>
                              ) : (
                                <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-md">Inactive</span>
                              )}
                              {num.outboundEnabled && (
                                <span className="text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                  <PhoneOutgoing className="w-3 h-3" /> Outbound
                                </span>
                              )}
                              <span className="text-xs text-slate-400 dark:text-slate-500 uppercase">{num.language}</span>
                            </div>
                          </div>
                        </div>

                        {/* Assignment + rules — full-width on mobile */}
                        <div className="flex items-center justify-between sm:justify-end gap-2 border-t border-slate-200/70 dark:border-slate-700/50 sm:border-0 pt-2 sm:pt-0">
                          {num.assignedAgentId ? (
                            <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 px-2.5 py-1.5 rounded-lg text-xs font-medium truncate max-w-[140px]">
                              <Bot className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">{agentName || 'Assigned agent'}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-slate-500 italic">Unassigned</span>
                          )}

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {rules && (
                              <span className="hidden sm:flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-lg">
                                <Settings className="w-3 h-3" />
                                Rules set
                              </span>
                            )}
                            <button
                              onClick={() => setAssignModal(num)}
                              title={num.assignedAgentId ? 'Change inbound agent' : 'Assign inbound agent'}
                              className="text-xs common-button-bg2 px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1 whitespace-nowrap"
                            >
                              <Bot className="w-3 h-3" />
                              <span className="hidden xs:inline sm:inline">{num.assignedAgentId ? 'Change' : 'Assign'}</span>
                              <span className="xs:hidden sm:hidden">{num.assignedAgentId ? '↺' : '+'}</span>
                            </button>
                            <button
                              onClick={() => setRulesModal(num)}
                              title="Configure routing rules"
                              className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                            {num.inboundEnabled && (
                              <button
                                onClick={() => setDeprovisionTarget(num)}
                                disabled={releasingId === num.id}
                                title="Detach AI employee & reset this number"
                                className="p-1.5 sm:p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {releasingId === num.id
                                  ? <Loader2 className="w-4 h-4 animate-spin" />
                                  : <Trash2 className="w-4 h-4" />}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            OUTBOUND
           ══════════════════════════════════════════════════════════════════ */}
        {activeSection === 'outbound' && (
          <motion.div
            key="outbound"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 sm:space-y-6"
          >
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
              {[
                { label: 'Campaigns', value: regularCampaigns.length, icon: PhoneOutgoing, color: 'from-blue-500 to-indigo-600' },
                { label: 'Direct Calls', value: directCallCampaigns.length, icon: PhoneCall, color: 'from-sky-500 to-cyan-600' },
                { label: 'Running', value: campaigns.filter((c) => c.status === 'running').length, icon: Play, color: 'from-green-500 to-emerald-600' },
                { label: 'Contacts Completed', value: campaigns.reduce((s, c) => s + (c.live?.completed || c.stats?.completed || 0), 0), icon: CheckCircle, color: 'from-purple-500 to-pink-600' },
              ].map((stat) => (
                <GlassCard key={stat.label}>
                  <div className="p-2 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:gap-3">
                    <div className={`hidden sm:flex w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} items-center justify-center flex-shrink-0`}>
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className={`sm:hidden w-6 h-6 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-1`}>
                      <stat.icon className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white leading-tight">{stat.value}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">{stat.label}</p>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>

            {/* Outbound Numbers — enable outbound + pick the agent that places calls */}
            <GlassCard>
              <div className="p-4 sm:p-6">
                <SectionHeader
                  icon={PhoneOutgoing}
                  title="Outbound Numbers"
                  subtitle="Enable outbound on a number, then choose the AI agent that places its calls"
                  color="bg-gradient-to-br from-indigo-500 to-purple-600"
                />

                {actionError && (
                  <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600 dark:text-red-400 flex-1">{actionError}</p>
                    <button onClick={() => setActionError(null)} className="text-red-400 hover:text-red-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {outboundEligibleNumbers.length === 0 ? (
                  <div className="mt-4 text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                    <PhoneOutgoing className="w-9 h-9 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      No active numbers yet. Go to the{' '}
                      <button onClick={() => setActiveSection('inbound')} className="underline font-medium text-indigo-600 dark:text-indigo-400">Inbound</button>{' '}
                      tab and buy a number first.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-2">
                    {outboundEligibleNumbers.map((num) => {
                      const busy = outboundAgentSavingId === num.id || enablingOutboundId === num.id;
                      return (
                        <div
                          key={num.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-xl common-bg-icons gap-2 sm:gap-3"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                              <PhoneOutgoing className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 dark:text-white text-sm">{num.number}</p>
                              <div className="flex flex-wrap items-center gap-1 mt-0.5">
                                <span className="text-xs text-slate-500 dark:text-slate-400">{num.friendlyName}</span>
                                {num.outboundEnabled ? (
                                  <span className="text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-md">Outbound on</span>
                                ) : (
                                  <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-md">Outbound off</span>
                                )}
                                <span className="text-xs text-slate-400 dark:text-slate-500 uppercase">{num.language}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-2 border-t border-slate-200/70 dark:border-slate-700/50 sm:border-0 pt-2 sm:pt-0">
                            {num.outboundEnabled ? (
                              <>
                                {(() => {
                                  const outName = agentLabel(num.outboundAgentId);
                                  return num.outboundAgentId ? (
                                    <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 px-2.5 py-1.5 rounded-lg text-xs font-medium truncate max-w-[140px]">
                                      <Bot className="w-3.5 h-3.5 flex-shrink-0" />
                                      <span className="truncate">{outName || 'Assigned agent'}</span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-slate-400 dark:text-slate-500 italic">No agent</span>
                                  );
                                })()}
                                <button
                                  onClick={() => setOutboundAssignModal(num)}
                                  disabled={busy}
                                  title={num.outboundAgentId ? 'Change outbound agent' : 'Assign outbound agent'}
                                  className="text-xs common-button-bg2 px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1 whitespace-nowrap disabled:opacity-50"
                                >
                                  {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bot className="w-3 h-3" />}
                                  {num.outboundAgentId ? 'Change' : 'Assign'}
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleEnableOutbound(num)}
                                disabled={busy}
                                title="Enable outbound calling on this number"
                                className="text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 whitespace-nowrap bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors disabled:opacity-50"
                              >
                                {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <PhoneOutgoing className="w-3 h-3" />}
                                Enable outbound
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Campaigns / Direct Calls */}
            <GlassCard>
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <SectionHeader
                    icon={outboundListTab === 'direct' ? PhoneCall : PhoneOutgoing}
                    title={outboundListTab === 'direct' ? 'Direct Calls' : 'Outbound Campaigns'}
                    subtitle={
                      outboundListTab === 'direct'
                        ? 'Contact-list batches placed without a campaign wizard'
                        : 'Create AI-powered outbound call campaigns'
                    }
                    color="bg-gradient-to-br from-indigo-500 to-purple-600"
                  />
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={loadCampaigns}
                      disabled={campaignsLoading}
                      title="Refresh"
                      className="p-2.5 rounded-xl common-bg-icons text-slate-500 dark:text-slate-400 hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      <Loader2 className={`w-4 h-4 ${campaignsLoading ? 'animate-spin' : ''}`} />
                    </button>
                    {outboundListTab === 'direct' ? (
                      <button
                        onClick={openDirectCallModal}
                        disabled={campaignCallerNumbers.length === 0}
                        title={
                          campaignCallerNumbers.length === 0
                            ? 'Set an outbound agent on a number first'
                            : 'Place a direct call without a campaign'
                        }
                        className="common-button-bg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <PhoneCall className="w-4 h-4" />
                        Direct Call
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={openDirectCallModal}
                          disabled={campaignCallerNumbers.length === 0}
                          title={
                            campaignCallerNumbers.length === 0
                              ? 'Set an outbound agent on a number first'
                              : 'Place a direct call without a campaign'
                          }
                          className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <PhoneCall className="w-4 h-4" />
                          Direct Call
                        </button>
                        <button
                          onClick={openCampaignWizard}
                          disabled={campaignCallerNumbers.length === 0}
                          title={campaignCallerNumbers.length === 0 ? 'Set an outbound agent on a number first' : 'Create a new campaign'}
                          className="common-button-bg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-4 h-4" />
                          New Campaign
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-1 p-1 rounded-xl common-bg-icons mb-5 self-start w-full sm:w-auto">
                  {(
                    [
                      { id: 'campaigns' as const, label: 'Campaigns List', count: regularCampaigns.length, icon: PhoneOutgoing },
                      { id: 'direct' as const, label: 'Direct Calls List', count: directCallCampaigns.length, icon: PhoneCall },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setOutboundListTab(tab.id)}
                      className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                        outboundListTab === tab.id
                          ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      <tab.icon className="w-3.5 h-3.5" />
                      {tab.label}
                      <span
                        className={`text-[11px] px-1.5 py-0.5 rounded-md tabular-nums ${
                          outboundListTab === tab.id
                            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300'
                            : 'bg-slate-200/70 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* No campaign-ready numbers → guide the user to set an outbound agent first */}
                {!campaignsLoading && campaignCallerNumbers.length === 0 && outboundDisplayedCampaigns.length === 0 && (
                  <div className="mb-4 flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-700 dark:text-amber-300">
                      <p className="font-medium">Set up an outbound number first</p>
                      <p className="text-amber-600 dark:text-amber-400 mt-0.5">
                        Outbound calling needs a number that is <span className="font-medium">outbound-enabled</span> and has an{' '}
                        <span className="font-medium">outbound agent</span>. Use the{' '}
                        <span className="font-medium">Outbound Numbers</span> section above to enable outbound and pick an agent.
                      </p>
                    </div>
                  </div>
                )}

                {campaignsError && (
                  <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600 dark:text-red-400 flex-1">{campaignsError}</p>
                    <button onClick={() => setCampaignsError(null)} className="text-red-400 hover:text-red-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {campaignsLoading && outboundDisplayedCampaigns.length === 0 ? (
                  <div className="flex items-center justify-center py-14 gap-2 text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">
                      {outboundListTab === 'direct' ? 'Loading direct calls…' : 'Loading campaigns…'}
                    </span>
                  </div>
                ) : outboundDisplayedCampaigns.length === 0 ? (
                  <div className="text-center py-14 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 flex items-center justify-center mx-auto mb-4">
                      {outboundListTab === 'direct' ? (
                        <PhoneCall className="w-7 h-7 text-indigo-500" />
                      ) : (
                        <PhoneOutgoing className="w-7 h-7 text-indigo-500" />
                      )}
                    </div>
                    <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      {outboundListTab === 'direct' ? 'No direct calls yet' : 'No campaigns yet'}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
                      {outboundListTab === 'direct'
                        ? 'Add contacts and place a Direct Call — batches appear here and use the same dialer as campaigns.'
                        : 'Create a campaign to start making AI-powered outbound calls to your contacts.'}
                    </p>
                    {outboundListTab === 'direct' ? (
                      <button
                        onClick={openDirectCallModal}
                        disabled={campaignCallerNumbers.length === 0}
                        className="common-button-bg inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <PhoneCall className="w-4 h-4" /> Place Direct Call
                      </button>
                    ) : (
                      <button
                        onClick={openCampaignWizard}
                        disabled={campaignCallerNumbers.length === 0}
                        className="common-button-bg inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4" /> Create Campaign
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {outboundDisplayedCampaigns.map((campaign) => {
                      const agent = agents.find((a) => a.id === campaign.agent_id);
                      const live = campaign.live || (campaign.stats as CampaignLiveStatus | undefined);
                      const total = live?.total || 0;
                      const done = (live?.completed || 0) + (live?.no_answer || 0);
                      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                      const busy = campaignActionId === campaign._id;
                      const isDirect = isDirectCallCampaign(campaign);
                      return (
                        <div
                          key={campaign._id}
                          role="button"
                          tabIndex={0}
                          onClick={() => navigate(`/campaigns/${campaign._id}`)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              navigate(`/campaigns/${campaign._id}`);
                            }
                          }}
                          className="group relative bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 p-4 sm:p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div className="flex items-start gap-3.5 flex-1 min-w-0">
                              <div className="w-11 h-11 rounded-xl bg-slate-800 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 shadow-sm">
                                {isDirect ? (
                                  <PhoneCall className="w-5 h-5 text-white" />
                                ) : (
                                  <PhoneOutgoing className="w-5 h-5 text-white" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base tracking-tight">
                                    {campaign.name}
                                  </h4>
                                  {statusBadge(campaign.status)}
                                  {isDirect && (
                                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300">
                                      Direct
                                    </span>
                                  )}
                                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hidden sm:inline-flex items-center gap-1 text-xs ml-1">
                                    View details <ExternalLink className="w-3 h-3" />
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 text-xs text-slate-500 dark:text-slate-400">
                                  {agent && (
                                    <span className="flex items-center gap-1.5">
                                      <Bot className="w-3.5 h-3.5" />
                                      {agent.name}
                                    </span>
                                  )}
                                  {campaign.caller_number && (
                                    <span className="flex items-center gap-1.5 font-mono">
                                      <Phone className="w-3.5 h-3.5" />
                                      {campaign.caller_number}
                                    </span>
                                  )}
                                  <span className="uppercase tracking-wide self-center">{campaign.language}</span>
                                  {live && (
                                    <span className="flex items-center gap-1.5">
                                      <Users className="w-3.5 h-3.5" />
                                      {total} contacts
                                    </span>
                                  )}
                                </div>

                                {live && total > 0 && (
                                  <div className="mt-3.5 max-w-lg">
                                    <div className="flex items-center justify-between mb-1.5">
                                      <span className="text-xs text-slate-500 dark:text-slate-400">
                                        {done} / {total} dialed
                                      </span>
                                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                                        {pct}%
                                      </span>
                                    </div>
                                    <div className="h-1.5 bg-slate-100 dark:bg-slate-700/80 rounded-full overflow-hidden">
                                      <motion.div
                                        className="h-full bg-slate-800 dark:bg-slate-300 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pct}%` }}
                                        transition={{ duration: 0.6, ease: 'easeOut' }}
                                      />
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs">
                                      <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                        <PhoneCall className="w-3 h-3" />
                                        {live.dialing || 0} dialing
                                      </span>
                                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" />
                                        {live.completed || 0} done
                                      </span>
                                      <span className="text-slate-500 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {live.pending || 0} pending
                                      </span>
                                      <span className="text-rose-500 flex items-center gap-1">
                                        <PhoneMissed className="w-3 h-3" />
                                        {live.no_answer || 0} no answer
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div
                              className="flex items-center gap-1 flex-shrink-0 self-end sm:self-start relative"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {campaign.status === 'running' && (
                                <button
                                  onClick={(e) => handleCampaignAction(campaign._id, 'pause', e)}
                                  disabled={busy}
                                  title="Pause"
                                  className="p-2.5 rounded-xl text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 border border-transparent hover:border-amber-200 dark:hover:border-amber-800 transition-colors disabled:opacity-50"
                                >
                                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pause className="w-4 h-4" />}
                                </button>
                              )}
                              {campaign.status === 'paused' && (
                                <button
                                  onClick={(e) => handleCampaignAction(campaign._id, 'resume', e)}
                                  disabled={busy}
                                  title="Resume remaining contacts"
                                  className="p-2.5 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors disabled:opacity-50"
                                >
                                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                </button>
                              )}
                              {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
                                <button
                                  onClick={(e) => handleCampaignAction(campaign._id, 'start', e)}
                                  disabled={busy}
                                  title="Start dialing"
                                  className="p-2.5 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors disabled:opacity-50"
                                >
                                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                </button>
                              )}
                              {(campaign.status === 'running' || campaign.status === 'paused') && (
                                <button
                                  onClick={(e) => handleCampaignAction(campaign._id, 'stop', e)}
                                  disabled={busy}
                                  title="Stop (cannot resume)"
                                  className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition-colors disabled:opacity-50"
                                >
                                  <Square className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId((prev) => (prev === campaign._id ? null : campaign._id));
                                }}
                                disabled={busy}
                                title="More actions"
                                className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition-colors disabled:opacity-50"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                              {openMenuId === campaign._id && (
                                <div className="absolute right-0 top-12 z-20 w-48 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl py-1">
                                  {!isDirect && campaign.status !== 'running' && campaign.status !== 'archived' && (
                                    <button
                                      onClick={(e) => openEditWizard(campaign, e)}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    >
                                      <Pencil className="w-3.5 h-3.5" /> Edit
                                    </button>
                                  )}
                                  {!isDirect && (
                                    <button
                                      onClick={(e) => handleCampaignAction(campaign._id, 'clone', e)}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    >
                                      <CopyPlus className="w-3.5 h-3.5" /> Clone settings
                                    </button>
                                  )}
                                  {!isDirect && (campaign.status === 'stopped' || campaign.status === 'paused') && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMenuId(null);
                                        setRestartCampaignTarget(campaign);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" /> Restart
                                    </button>
                                  )}
                                  {campaign.status !== 'archived' && (
                                    <button
                                      onClick={(e) => handleCampaignAction(campaign._id, 'archive', e)}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    >
                                      <Archive className="w-3.5 h-3.5" /> Archive
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuId(null);
                                      setDeleteCampaignId(campaign._id);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            CONTACT LIST
           ══════════════════════════════════════════════════════════════════ */}
        {activeSection === 'contacts' && (
          <motion.div
            key="contacts"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 sm:space-y-6"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
              {[
                { label: 'Total Contacts', value: previousContacts.length, icon: Users, color: 'from-blue-500 to-indigo-600' },
                {
                  label: 'With Name',
                  value: previousContacts.filter((c) => String(c.name || '').trim()).length,
                  icon: BookUser,
                  color: 'from-emerald-500 to-teal-600',
                },
                {
                  label: 'Showing',
                  value: filteredPreviousContacts.length,
                  icon: Search,
                  color: 'from-violet-500 to-purple-600',
                },
              ].map((stat) => (
                <GlassCard key={stat.label}>
                  <div className="p-2 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:gap-3">
                    <div className={`hidden sm:flex w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} items-center justify-center flex-shrink-0`}>
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className={`sm:hidden w-6 h-6 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-1`}>
                      <stat.icon className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white leading-tight">{stat.value}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">{stat.label}</p>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>

            <GlassCard>
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                  <SectionHeader
                    icon={BookUser}
                    title="Contact List"
                    subtitle="Tenant contacts for direct calling and campaigns"
                    color="bg-gradient-to-br from-indigo-500 to-violet-600"
                  />
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => loadPreviousContacts(previousContactSearch)}
                      disabled={previousContactsLoading}
                      className="common-button-bg2 inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl disabled:opacity-50"
                    >
                      {previousContactsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <History className="w-4 h-4" />}
                      Refresh
                    </button>
                    <button
                      type="button"
                      onClick={openCreateContactModal}
                      className="common-button-bg inline-flex items-center gap-2 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add Contact
                    </button>
                  </div>
                </div>

                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="search"
                    value={previousContactSearch}
                    onChange={(e) => setPreviousContactSearch(e.target.value)}
                    placeholder="Search by name or phone…"
                    className="common-bg-icons w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                  />
                </div>

                {previousContactsLoading && (
                  <div className="flex items-center justify-center py-14 gap-2 text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Loading contacts…</span>
                  </div>
                )}

                {!previousContactsLoading && previousContactsError && (
                  <div className="text-center py-12 border-2 border-dashed border-red-200 dark:border-red-800 rounded-2xl">
                    <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-3" />
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{previousContactsError}</p>
                    <button onClick={() => loadPreviousContacts()} className="common-button-bg2 inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl">
                      Try again
                    </button>
                  </div>
                )}

                {!previousContactsLoading && !previousContactsError && filteredPreviousContacts.length === 0 && (
                  <div className="text-center py-14 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                    <Users className="w-7 h-7 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      {previousContactSearch.trim() ? 'No matching contacts' : 'No contacts yet'}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
                      {previousContactSearch.trim()
                        ? 'Try a different name or phone number.'
                        : 'Create contacts here, then use Direct Call or campaigns to dial them.'}
                    </p>
                    {!previousContactSearch.trim() && (
                      <button
                        type="button"
                        onClick={openCreateContactModal}
                        className="common-button-bg inline-flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> Add Contact
                      </button>
                    )}
                  </div>
                )}

                {!previousContactsLoading && !previousContactsError && filteredPreviousContacts.length > 0 && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="max-h-[28rem] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredPreviousContacts.map((c) => (
                        <div key={c._id} className="flex items-center justify-between gap-3 px-4 py-3">
                          <div className="min-w-0 flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                              <Phone className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                                {c.name?.trim() || 'Unknown'}
                              </p>
                              <p className="text-sm font-mono text-slate-600 dark:text-slate-300 truncate">{c.phone_number}</p>
                              {c.custom_fields?.call_context && (
                                <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                                  {c.custom_fields.call_context}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              type="button"
                              title="Call history"
                              onClick={() => navigate(`/contacts/${c._id}/call-history`)}
                              className="p-2 rounded-lg text-slate-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                            >
                              <History className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              title="Direct call"
                              onClick={() => queueContactForDirectCall(c)}
                              disabled={campaignCallerNumbers.length === 0}
                              className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 disabled:opacity-40"
                            >
                              <PhoneCall className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              title="Edit"
                              onClick={() => openEditContactModal(c)}
                              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              title="Archive"
                              onClick={() =>
                                setArchiveContactTarget({
                                  id: c._id,
                                  name: c.name || '',
                                  phone_number: c.phone_number,
                                })
                              }
                              className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            CONNECTORS
           ══════════════════════════════════════════════════════════════════ */}
        {activeSection === 'connectors' && (
          <motion.div
            key="connectors"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 sm:space-y-6"
          >
            <GlassCard>
              <div className="p-4 sm:p-6">
                <SectionHeader
                  icon={Plug}
                  title="CRM Connector"
                  subtitle="Connect Zoho and other CRM tools to sync contacts for outbound calling"
                  color="bg-gradient-to-br from-amber-500 to-orange-600"
                />

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {CRM_CONNECTORS.map((connector) => (
                    <div
                      key={connector.id}
                      className="flex flex-col gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 common-bg-icons"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden p-2">
                          <img src={connector.icon} alt="" className="w-full h-full object-contain" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold text-slate-800 dark:text-white">{connector.name}</h3>
                            <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300">
                              Soon
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            {connector.description}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          appToast.info(`Contact us to enable ${connector.name} lead sync on your plan.`);
                          setShowPremiumContactModal(true);
                        }}
                        className="common-button-bg2 w-full py-2.5 rounded-xl text-sm font-medium inline-flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Request access
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex items-start gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Need a connector we don’t list yet? Request access and tell us which lead generation tool you use — we’ll help wire it into your Contact List.
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            ANALYTICS
           ══════════════════════════════════════════════════════════════════ */}
        {activeSection === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 sm:space-y-6"
          >
            {(() => {
              const completedCalls = campaigns.reduce(
                (s, c) => s + (c.live?.completed || c.stats?.completed || 0),
                0
              );
              const pendingCalls = campaigns.reduce(
                (s, c) => s + (c.live?.pending || c.stats?.pending || 0),
                0
              );
              const noAnswerCalls = campaigns.reduce(
                (s, c) => s + (c.live?.no_answer || c.stats?.no_answer || 0),
                0
              );
              const dialedCalls = campaigns.reduce(
                (s, c) => s + (c.live?.dialing || c.stats?.dialing || 0),
                0
              );
              const runningCampaigns = campaigns.filter((c) => c.status === 'running').length;
              const totalAttempted = completedCalls + pendingCalls + noAnswerCalls + dialedCalls;
              const connectRate =
                totalAttempted > 0 ? Math.round((completedCalls / totalAttempted) * 100) : 0;

              return (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                    {[
                      { label: 'Campaigns', value: campaigns.length, icon: Zap, color: 'from-blue-500 to-indigo-600' },
                      { label: 'Running', value: runningCampaigns, icon: Play, color: 'from-green-500 to-emerald-600' },
                      { label: 'Completed Calls', value: completedCalls, icon: PhoneCall, color: 'from-purple-500 to-pink-600' },
                      { label: 'Connect Rate', value: `${connectRate}%`, icon: BarChart3, color: 'from-cyan-500 to-blue-600' },
                    ].map((stat) => (
                      <GlassCard key={stat.label}>
                        <div className="p-2 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:gap-3">
                          <div className={`hidden sm:flex w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} items-center justify-center flex-shrink-0`}>
                            <stat.icon className="w-5 h-5 text-white" />
                          </div>
                          <div className={`sm:hidden w-6 h-6 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-1`}>
                            <stat.icon className="w-3 h-3 text-white" />
                          </div>
                          <div>
                            <p className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white leading-tight">{stat.value}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">{stat.label}</p>
                          </div>
                        </div>
                      </GlassCard>
                    ))}
                  </div>

                  <GlassCard>
                    <div className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                        <SectionHeader
                          icon={BarChart3}
                          title="Call Setup Analytics"
                          subtitle="Outbound campaign performance, agent metrics, and downloadable reports"
                          color="bg-gradient-to-br from-cyan-500 to-blue-600"
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={generateAnalyticsReport}
                            disabled={campaignsLoading && agents.length === 0}
                            className="common-button-bg2 inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl disabled:opacity-50"
                          >
                            <FileDown className="w-4 h-4" />
                            Generate report
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate('/analytics')}
                            className="common-button-bg inline-flex items-center gap-2 text-sm"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Full call history
                          </button>
                        </div>
                      </div>

                      {campaignsLoading && (
                        <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span className="text-sm">Loading analytics…</span>
                        </div>
                      )}

                      {!campaignsLoading && (
                        <div className="space-y-4">
                          {campaigns.length === 0 ? (
                            <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                              <BarChart3 className="w-7 h-7 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                              <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-2">No campaign data yet</h3>
                              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
                                Create an outbound campaign to track dial outcomes. Agent performance below still reflects session metrics.
                              </p>
                              <button
                                type="button"
                                onClick={() => setActiveSection('outbound')}
                                className="common-button-bg inline-flex items-center gap-2"
                              >
                                <PhoneOutgoing className="w-4 h-4" /> Go to Outbound
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[
                                  { label: 'Pending', value: pendingCalls, icon: Clock, tone: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20' },
                                  { label: 'Not answered', value: noAnswerCalls, icon: PhoneMissed, tone: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20' },
                                  { label: 'Dialing now', value: dialedCalls, icon: PhoneOutgoing, tone: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' },
                                ].map((item) => (
                                  <div key={item.label} className={`rounded-xl p-4 flex items-center gap-3 ${item.tone}`}>
                                    <item.icon className="w-5 h-5 flex-shrink-0" />
                                    <div>
                                      <p className="text-xl font-bold leading-tight">{item.value}</p>
                                      <p className="text-xs opacity-80">{item.label}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Campaign breakdown</p>
                                </div>
                                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
                                  {campaigns.map((c) => {
                                    const completed = c.live?.completed || c.stats?.completed || 0;
                                    const pending = c.live?.pending || c.stats?.pending || 0;
                                    const noAnswer = c.live?.no_answer || c.stats?.no_answer || 0;
                                    const total = completed + pending + noAnswer || 1;
                                    const pct = Math.round((completed / total) * 100);
                                    return (
                                      <button
                                        key={c._id}
                                        type="button"
                                        onClick={() => navigate(`/campaigns/${c._id}`)}
                                        className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                                      >
                                        <div className="flex items-center justify-between gap-3 mb-2">
                                          <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{c.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{c.status}</p>
                                          </div>
                                          <span className="text-xs font-medium text-slate-600 dark:text-slate-300 flex-shrink-0">
                                            {completed} completed · {pct}%
                                          </span>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                                          <div
                                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                                            style={{ width: `${Math.min(100, pct)}%` }}
                                          />
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </>
                          )}

                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Phone numbers</p>
                              <p className="text-lg font-bold text-slate-800 dark:text-white">{numbers.length}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Saved contacts</p>
                              <p className="text-lg font-bold text-slate-800 dark:text-white">{previousContacts.length}</p>
                            </div>
                          </div>

                          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Agent-wise performance</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Sessions, success rate, and outbound dial outcomes per AI employee</p>
                              </div>
                              {agentPerfLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                            </div>
                            {agents.length === 0 ? (
                              <p className="text-sm text-slate-400 text-center py-8">No AI employees yet</p>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="text-left text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                      <th className="px-4 py-2.5 font-medium">Agent</th>
                                      <th className="px-4 py-2.5 font-medium">Sessions</th>
                                      <th className="px-4 py-2.5 font-medium">Success</th>
                                      <th className="px-4 py-2.5 font-medium">Campaigns</th>
                                      <th className="px-4 py-2.5 font-medium">Completed</th>
                                      <th className="px-4 py-2.5 font-medium">Connect</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {buildAgentPerformanceRows().map((row) => (
                                      <tr key={row.agent.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                        <td className="px-4 py-3">
                                          <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                                              <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <div className="min-w-0">
                                              <p className="font-medium text-slate-800 dark:text-white truncate">{row.agent.name}</p>
                                              <p className="text-xs text-slate-400 truncate">{row.agent.status}</p>
                                            </div>
                                          </div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{row.sessions}</td>
                                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{row.successRate}%</td>
                                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{row.campaigns}</td>
                                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{row.completed}</td>
                                        <td className="px-4 py-3">
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300">
                                            {row.connectRate}%
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </GlassCard>
                </>
              );
            })()}
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            FOLLOW-UPS / REQUESTED CALLBACKS
           ══════════════════════════════════════════════════════════════════ */}
        {activeSection === 'followups' && (
          <motion.div
            key="followups"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 sm:space-y-6"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
              {[
                { label: 'Total', value: followUps.length, icon: CalendarClock, color: 'from-violet-500 to-purple-600' },
                {
                  label: 'Callbacks',
                  value: followUps.filter((f) => f.type === 'callback').length,
                  icon: PhoneIncoming,
                  color: 'from-amber-500 to-orange-600',
                },
                {
                  label: 'Follow-ups',
                  value: followUps.filter((f) => f.type === 'follow_up').length,
                  icon: PhoneOutgoing,
                  color: 'from-blue-500 to-indigo-600',
                },
                {
                  label: 'High urgency',
                  value: followUps.filter((f) => String(f.urgency || '').toLowerCase() === 'high').length,
                  icon: AlertCircle,
                  color: 'from-rose-500 to-red-600',
                },
              ].map((stat) => (
                <GlassCard key={stat.label}>
                  <div className="p-2 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:gap-3">
                    <div className={`hidden sm:flex w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} items-center justify-center flex-shrink-0`}>
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className={`sm:hidden w-6 h-6 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-1`}>
                      <stat.icon className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white leading-tight">{stat.value}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">{stat.label}</p>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>

            <GlassCard>
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                  <SectionHeader
                    icon={CalendarClock}
                    title="Follow-ups & Callbacks"
                    subtitle="Requested callbacks and follow-ups captured from AI conversations and campaign contacts"
                    color="bg-gradient-to-br from-violet-500 to-purple-600"
                  />
                  <button
                    type="button"
                    onClick={loadFollowUps}
                    disabled={followUpsLoading}
                    className="common-button-bg2 inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl disabled:opacity-50"
                  >
                    {followUpsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <History className="w-4 h-4" />}
                    Refresh
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="search"
                      value={followUpSearch}
                      onChange={(e) => setFollowUpSearch(e.target.value)}
                      placeholder="Search name, phone, agent, or notes…"
                      className="common-bg-icons w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                  <div className="flex gap-1 common-bg-icons rounded-xl p-1 self-start">
                    {([
                      { id: 'all', label: 'All' },
                      { id: 'callback', label: 'Callbacks' },
                      { id: 'follow_up', label: 'Follow-ups' },
                    ] as const).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFollowUpFilter(f.id)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          followUpFilter === f.id
                            ? 'common-button-bg2 shadow-sm'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {followUpsLoading && (
                  <div className="flex items-center justify-center py-14 gap-2 text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Loading follow-ups…</span>
                  </div>
                )}

                {!followUpsLoading && followUpsError && (
                  <div className="text-center py-12 border-2 border-dashed border-red-200 dark:border-red-800 rounded-2xl">
                    <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-3" />
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{followUpsError}</p>
                    <button onClick={loadFollowUps} className="common-button-bg2 inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl">
                      Try again
                    </button>
                  </div>
                )}

                {!followUpsLoading && !followUpsError && filteredFollowUps.length === 0 && (
                  <div className="text-center py-14 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                    <CalendarClock className="w-7 h-7 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      {followUpSearch.trim() || followUpFilter !== 'all' ? 'No matching items' : 'No follow-ups yet'}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                      When callers request a callback or follow-up, they will appear here from call summaries and campaign contact context.
                    </p>
                  </div>
                )}

                {!followUpsLoading && !followUpsError && filteredFollowUps.length > 0 && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="max-h-[32rem] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredFollowUps.map((item) => (
                        <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                item.type === 'callback'
                                  ? 'bg-amber-50 dark:bg-amber-900/30'
                                  : 'bg-violet-50 dark:bg-violet-900/30'
                              }`}
                            >
                              {item.type === 'callback' ? (
                                <PhoneIncoming className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                              ) : (
                                <CalendarClock className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                                  {item.name}
                                </p>
                                <span
                                  className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md ${
                                    item.type === 'callback'
                                      ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                                      : 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                                  }`}
                                >
                                  {item.type === 'callback' ? 'Callback' : 'Follow-up'}
                                </span>
                                {item.urgency && (
                                  <span
                                    className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md ${
                                      String(item.urgency).toLowerCase() === 'high'
                                        ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300'
                                        : String(item.urgency).toLowerCase() === 'medium'
                                          ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                    }`}
                                  >
                                    {item.urgency}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-mono text-slate-600 dark:text-slate-300">{item.phone}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{item.summary}</p>
                              <p className="text-[11px] text-slate-400 mt-1">
                                {item.agentName}
                                {item.createdAt
                                  ? ` · ${new Date(item.createdAt).toLocaleString()}`
                                  : ''}
                                {item.source === 'contact' ? ' · Campaign contact' : ''}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSection('outbound');
                              appToast.info(`Use Outbound to call back ${item.phone}`);
                            }}
                            className="common-button-bg2 self-start sm:self-center inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl flex-shrink-0"
                          >
                            <PhoneOutgoing className="w-3.5 h-3.5" />
                            Call back
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {createPortal(
        <>
      <AnimatePresence>
        {restartCampaignTarget && (
          <RestartCampaignModal
            campaign={restartCampaignTarget}
            onClose={() => setRestartCampaignTarget(null)}
            onDone={async () => {
              setRestartCampaignTarget(null);
              await loadCampaigns();
            }}
          />
        )}
      </AnimatePresence>

      {/* Direct Call — no campaign wizard */}
      <AnimatePresence>
        {showDirectCallModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 overflow-hidden"
            onClick={(e) => {
              if (e.target === e.currentTarget && !directCallBusy) {
                setShowDirectCallModal(false);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="flex items-start justify-between gap-3 p-5 sm:p-6 pb-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <PhoneCall className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-800 dark:text-white">Direct Call</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      Call one or more numbers — each can have its own call context
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => !directCallBusy && setShowDirectCallModal(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 sm:p-6 space-y-5 flex-1 min-h-0 overflow-y-auto overscroll-contain">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                    Caller number
                  </label>
                  <select
                    value={directCallerNumberId}
                    onChange={(e) => setDirectCallerNumberId(e.target.value)}
                    disabled={directCallBusy}
                    className="common-bg-icons w-full px-3 py-2.5 rounded-xl text-sm"
                  >
                    {campaignCallerNumbers.length === 0 ? (
                      <option value="">No outbound-ready numbers</option>
                    ) : (
                      campaignCallerNumbers.map((n) => (
                        <option key={n.id} value={n.id}>
                          {formatDid(n.number)}
                          {agentLabel(n.outboundAgentId) ? ` · ${agentLabel(n.outboundAgentId)}` : ''}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="flex gap-1 p-1 rounded-xl common-bg-icons">
                  {(
                    [
                      { id: 'new' as const, label: 'New contact', icon: Plus },
                      { id: 'list' as const, label: 'From list', icon: BookUser },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setDirectCallMode(tab.id);
                        setDirectCallError(null);
                        setDirectPhoneError(null);
                      }}
                      disabled={directCallBusy}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        directCallMode === tab.id
                          ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      <tab.icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {directCallMode === 'new' ? (
                  <div className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-700 p-3.5">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                        Phone number
                      </label>
                      <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden common-bg-icons">
                        <select
                          value={directCountryId}
                          onChange={(e) => {
                            setDirectCountryId(e.target.value);
                            setDirectPhone('');
                            setDirectPhoneError(null);
                          }}
                          disabled={directCallBusy}
                          className="bg-transparent border-r border-slate-200 dark:border-slate-700 px-2 py-2.5 text-sm focus:outline-none text-slate-800 dark:text-white"
                        >
                          {COUNTRY_CODES.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.flag} {c.code}
                            </option>
                          ))}
                        </select>
                        <input
                          type="tel"
                          inputMode="numeric"
                          value={directPhone}
                          maxLength={directCountry.maxLen}
                          onChange={(e) => {
                            setDirectPhoneError(null);
                            setDirectPhone(sanitizeNationalNumber(e.target.value, directCountry));
                          }}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDirectNewContact())}
                          placeholder={`${directCountry.maxLen}-digit number`}
                          disabled={directCallBusy}
                          className="flex-1 bg-transparent px-3 py-2.5 text-sm focus:outline-none text-slate-800 dark:text-white placeholder-slate-400 min-w-0"
                        />
                      </div>
                      {directPhoneError ? (
                        <p className="text-xs text-rose-500 mt-1">{directPhoneError}</p>
                      ) : (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          Max {directCountry.maxLen} digits · {directCountry.flag} {directCountry.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                        Name (optional)
                      </label>
                      <input
                        type="text"
                        value={directName}
                        onChange={(e) => setDirectName(e.target.value)}
                        placeholder="Contact name"
                        disabled={directCallBusy}
                        className="common-bg-icons w-full px-4 py-2.5 rounded-xl text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                        Call context for this number
                      </label>
                      <textarea
                        value={directContext}
                        onChange={(e) => setDirectContext(e.target.value)}
                        placeholder="Why you're calling this contact…"
                        rows={2}
                        disabled={directCallBusy}
                        className="common-bg-icons w-full px-4 py-2.5 rounded-xl text-sm resize-none"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleAddDirectNewContact}
                        disabled={directCallBusy || !directPhone.trim()}
                        className="common-button-bg !px-3.5 !py-2.5 !min-w-[44px] rounded-xl inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
                        title="Add number to call list"
                      >
                        <Plus className="w-4 h-4 text-white" strokeWidth={2.5} />
                        <span className="text-sm text-white">Add</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="search"
                          value={directContactSearch}
                          onChange={(e) => setDirectContactSearch(e.target.value)}
                          placeholder="Search phone or name…"
                          disabled={directCallBusy}
                          className="common-bg-icons w-full pl-9 pr-3 py-2 rounded-xl text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={loadPreviousContacts}
                        disabled={previousContactsLoading || directCallBusy}
                        className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 whitespace-nowrap"
                      >
                        Refresh
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Tap contacts to add or remove them. Edit each call context in the list below.
                    </p>

                    {previousContactsLoading ? (
                      <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm">Loading contacts…</span>
                      </div>
                    ) : filteredDirectContacts.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                        <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {directContactSearch.trim()
                            ? 'No contacts match your search'
                            : 'No contacts found yet'}
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-40 overflow-y-auto overscroll-contain rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredDirectContacts.map((c) => {
                          const phone = String(c.phone_number || '').trim();
                          const selected =
                            directSelectedIds.has(c._id) ||
                            directRecipients.some((r) => r.id === c._id || r.phone === phone);
                          return (
                            <button
                              key={c._id}
                              type="button"
                              onClick={() => handleToggleDirectListContact(c)}
                              disabled={directCallBusy}
                              className={`w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors ${
                                selected
                                  ? 'bg-indigo-50 dark:bg-indigo-900/30'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                              }`}
                            >
                              <div
                                className={`w-4 h-4 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                                  selected
                                    ? 'border-indigo-500 bg-indigo-500'
                                    : 'border-slate-300 dark:border-slate-600'
                                }`}
                              >
                                {selected && <Check className="w-2.5 h-2.5 text-white" />}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-800 dark:text-white truncate">
                                  {c.name || 'Unnamed'}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                  {c.phone_number}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Call list ({directRecipients.length})
                    </label>
                    {directRecipients.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setDirectRecipients([]);
                          setDirectSelectedIds(new Set());
                        }}
                        disabled={directCallBusy}
                        className="text-xs text-slate-500 hover:text-rose-600 disabled:opacity-50"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  {directRecipients.length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                      <PhoneCall className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto mb-1.5" />
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        No numbers added yet
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        Add new contacts or pick from your list
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {directRecipients.map((r, idx) => (
                        <div
                          key={r.id}
                          className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 space-y-2 bg-slate-50/60 dark:bg-slate-800/40"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-800 dark:text-white truncate">
                                {idx + 1}. {r.name || 'Unnamed'}
                              </p>
                              <p className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate">
                                {r.phone}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeDirectRecipient(r.id)}
                              disabled={directCallBusy}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 disabled:opacity-50"
                              title="Remove"
                              aria-label="Remove number"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                              Call context
                            </label>
                            <textarea
                              value={r.context || ''}
                              onChange={(e) =>
                                updateDirectRecipient(r.id, { context: e.target.value })
                              }
                              placeholder="Context for this number only…"
                              rows={2}
                              disabled={directCallBusy}
                              className="common-bg-icons w-full px-3 py-2 rounded-lg text-sm resize-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {directCallError && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
                    <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-rose-600 dark:text-rose-400">{directCallError}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 p-5 sm:p-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowDirectCallModal(false)}
                  disabled={directCallBusy}
                  className="px-4 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePlaceDirectCall}
                  disabled={
                    directCallBusy ||
                    campaignCallerNumbers.length === 0 ||
                    (directRecipients.length === 0 && !(directCallMode === 'new' && directPhone.trim()))
                  }
                  className="common-button-bg inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {directCallBusy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <PhoneCall className="w-4 h-4" />
                  )}
                  {directRecipients.length > 1
                    ? `Place ${directRecipients.length} Calls`
                    : 'Place Call'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contact create / edit */}
      <AnimatePresence>
        {showContactFormModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 overflow-hidden"
            onClick={(e) => {
              if (e.target === e.currentTarget && !contactFormBusy) setShowContactFormModal(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white">
                    {editingContact ? 'Edit contact' : 'Add contact'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Saved to your tenant contact list
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => !contactFormBusy && setShowContactFormModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 flex-1 overflow-y-auto">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={contactForm.name}
                    onChange={(e) => setContactForm((p) => ({ ...p, name: e.target.value }))}
                    disabled={contactFormBusy}
                    className="common-bg-icons w-full px-4 py-2.5 rounded-xl text-sm"
                    placeholder="Contact name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                    Phone number *
                  </label>
                  {editingContact ? (
                    <input
                      type="text"
                      value={editingContact.phone_number}
                      disabled
                      className="common-bg-icons w-full px-4 py-2.5 rounded-xl text-sm opacity-70 font-mono"
                    />
                  ) : (
                    <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden common-bg-icons">
                      <select
                        value={contactForm.countryId}
                        onChange={(e) =>
                          setContactForm((p) => ({ ...p, countryId: e.target.value, phone: '' }))
                        }
                        disabled={contactFormBusy}
                        className="bg-transparent border-r border-slate-200 dark:border-slate-700 px-2 py-2.5 text-sm"
                      >
                        {COUNTRY_CODES.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.flag} {c.code}
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={contactForm.phone}
                        maxLength={contactFormCountry.maxLen}
                        onChange={(e) =>
                          setContactForm((p) => ({
                            ...p,
                            phone: sanitizeNationalNumber(e.target.value, contactFormCountry),
                          }))
                        }
                        disabled={contactFormBusy}
                        placeholder={`${contactFormCountry.maxLen}-digit number`}
                        className="flex-1 bg-transparent px-3 py-2.5 text-sm focus:outline-none min-w-0"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm((p) => ({ ...p, email: e.target.value }))}
                    disabled={contactFormBusy}
                    className="common-bg-icons w-full px-4 py-2.5 rounded-xl text-sm"
                    placeholder="optional@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                    Call context (optional)
                  </label>
                  <textarea
                    value={contactForm.context}
                    onChange={(e) => setContactForm((p) => ({ ...p, context: e.target.value }))}
                    disabled={contactFormBusy}
                    rows={3}
                    className="common-bg-icons w-full px-4 py-2.5 rounded-xl text-sm resize-none"
                    placeholder="Notes for the agent when calling this contact…"
                  />
                </div>

                {contactFormError && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
                    <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-rose-600 dark:text-rose-400">{contactFormError}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 p-5 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowContactFormModal(false)}
                  disabled={contactFormBusy}
                  className="px-4 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveContactForm}
                  disabled={contactFormBusy}
                  className="common-button-bg inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {contactFormBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editingContact ? 'Save' : 'Create'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Archive contact confirm */}
      <AnimatePresence>
        {archiveContactTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && !contactFormBusy && setArchiveContactTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4"
            >
              <h3 className="font-bold text-slate-800 dark:text-white">Archive contact?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  {archiveContactTarget.name || archiveContactTarget.phone_number}
                </span>{' '}
                will be deactivated. Call history is kept.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setArchiveContactTarget(null)}
                  disabled={contactFormBusy}
                  className="px-4 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleArchiveContact}
                  disabled={contactFormBusy}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {contactFormBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                  Archive
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete campaign confirm */}
      <AnimatePresence>
        {deleteCampaignId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setDeleteCampaignId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4"
            >
              <h3 className="font-bold text-slate-800 dark:text-white">Delete campaign?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                This permanently removes{' '}
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  {campaigns.find((c) => c._id === deleteCampaignId)?.name || 'this campaign'}
                </span>{' '}
                and its contacts.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setDeleteCampaignId(null)}
                  className="px-4 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleCampaignAction(deleteCampaignId, 'delete')}
                  disabled={campaignActionId === deleteCampaignId}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {campaignActionId === deleteCampaignId ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deprovision / detach number confirm */}
      <AnimatePresence>
        {deprovisionTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setDeprovisionTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4"
            >
              <h3 className="font-bold text-slate-800 dark:text-white">Detach AI employee?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Detach the AI employee from{' '}
                <span className="font-mono font-medium text-slate-700 dark:text-slate-200">
                  {deprovisionTarget.number}
                </span>
                ? The number stays on your account, but inbound calls will no longer reach an agent until you assign one again.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setDeprovisionTarget(null)}
                  disabled={releasingId === deprovisionTarget.id}
                  className="px-4 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeprovision(deprovisionTarget)}
                  disabled={releasingId === deprovisionTarget.id}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {releasingId === deprovisionTarget.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Detach
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: Assign Agent to Number (inbound)
         ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {assignModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setAssignModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white">Assign AI Agent</h3>
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">{assignModal.number}</p>
                </div>
                <button onClick={() => setAssignModal(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 flex-1 overflow-y-auto">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Select an agent to handle inbound calls on this number.
                </p>

                <AgentPickerField
                  value={assignModal.assignedAgentId || ''}
                  onChange={(id) => {
                    if (id) handleAssignAgent(id);
                  }}
                  label="AI Agent"
                  required
                  placeholder="Search & select agent…"
                  active={!!assignModal}
                  disabled={!!assigningId}
                  variant="panel"
                />

                {assigningId && (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" /> Assigning…
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: Assign Outbound Agent to Number
         ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {outboundAssignModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && !outboundAgentSavingId && setOutboundAssignModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white">Assign Outbound Agent</h3>
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">{outboundAssignModal.number}</p>
                </div>
                <button
                  onClick={() => !outboundAgentSavingId && setOutboundAssignModal(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 flex-1 overflow-y-auto">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Select the AI agent that places outbound calls on this number.
                </p>

                <AgentPickerField
                  value={outboundAssignModal.outboundAgentId || ''}
                  onChange={handleOutboundAgentChange}
                  label="Outbound Agent"
                  placeholder="Search & select agent…"
                  active={!!outboundAssignModal}
                  disabled={!!outboundAgentSavingId}
                  allowClear
                  clearLabel="— No agent —"
                  variant="panel"
                />

                {outboundAgentSavingId && (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving…
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: Premium plan required for additional numbers
         ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showPremiumContactModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowPremiumContactModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700"
            >
              <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-full mx-auto mb-4">
                  <Phone className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 dark:text-white text-center mb-2">
                  Premium plan required
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-6">
                  You can buy only one phone number on your current plan. Contact us for a premium plan to purchase additional numbers.
                </p>
                <div className="flex flex-col gap-3">
                  <a
                    href={`https://wa.me/${SALES_WHATSAPP_NUMBER}?text=${encodeURIComponent(SALES_WHATSAPP_MESSAGE)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="h-11 px-4 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-all duration-200 font-medium flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Contact on WhatsApp
                  </a>
                  <a
                    href={`mailto:${SALES_EMAIL}?subject=${encodeURIComponent(SALES_EMAIL_SUBJECT)}`}
                    className="h-11 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all duration-200 font-medium flex items-center justify-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Send Email
                  </a>
                  <button
                    onClick={() => setShowPremiumContactModal(false)}
                    className="h-11 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: Buy & Provision a Number
         ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showBuyModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && !isBuying && setShowBuyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white">Buy a Phone Number</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Goes live for inbound calls immediately</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBuyModal(false)}
                  disabled={isBuying}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Step 1 — pick a number type (required), then a DID */}
                {didTypes.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Number Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedDidTypeId ?? ''}
                      onChange={(e) => {
                        if (e.target.value) loadCatalog(Number(e.target.value));
                      }}
                      className="common-bg-icons w-full px-4 py-2.5 rounded-xl text-sm"
                    >
                      {didTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}{t.requires_request ? ' (request required)' : ''}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Choose a number category (e.g. Mobile, Toll-Free) to see available numbers.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Available Numbers <span className="text-red-500">*</span>
                  </label>

                  {catalogLoading && (
                    <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Loading catalog…</span>
                    </div>
                  )}

                  {!catalogLoading && catalogError && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-600 dark:text-red-400">{catalogError}</p>
                    </div>
                  )}

                  {!catalogLoading && !catalogError && catalog.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                      <Hash className="w-9 h-9 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">No numbers available right now</p>
                    </div>
                  )}

                  {!catalogLoading && catalog.length > 0 && (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {catalog.map((did) => (
                        <button
                          key={did.id}
                          onClick={() => setSelectedDid(did)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all border ${
                            selectedDid?.id === did.id
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                              : 'border-transparent common-bg-icons hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                          }`}
                        >
                          <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                            <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 dark:text-white font-mono">
                              {formatDid(did.did_number)}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-slate-500 dark:text-slate-400">{did.type_label}</span>
                              <span className="text-xs text-slate-400 dark:text-slate-500">+{did.country_code}</span>
                            </div>
                          </div>
                          {selectedDid?.id === did.id && (
                            <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Step 2 — label + agent */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Display Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={buyDisplayName}
                    onChange={(e) => setBuyDisplayName(e.target.value)}
                    placeholder="e.g., Customer Support"
                    className="common-bg-icons w-full px-4 py-2.5 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <AgentPickerField
                    value={buyAgentId}
                    onChange={setBuyAgentId}
                    label="Answering Agent"
                    required
                    placeholder="Search & select agent…"
                    active={showBuyModal}
                    variant="panel"
                  />
                </div>

                {buyError && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600 dark:text-red-400">{buyError}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex gap-3 p-5 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
                <button
                  onClick={() => setShowBuyModal(false)}
                  disabled={isBuying}
                  className="common-button-bg2 flex-1 py-2.5 rounded-xl text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBuyNumber}
                  disabled={isBuying || !selectedDid || !buyAgentId || !buyDisplayName.trim()}
                  className="common-button-bg flex-1 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isBuying
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Provisioning…</>
                    : <><Check className="w-4 h-4" /> Buy & Provision</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: Inbound Routing Rules
         ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {rulesModal && (
          <InboundRulesModal
            number={rulesModal}
            existingRule={inboundRules[rulesModal.id]}
            onSave={handleSaveRules}
            onClose={() => setRulesModal(null)}
          />
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: Create Outbound Campaign (3-step wizard)
         ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showCreateCampaign && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowCreateCampaign(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl lg:max-w-4xl shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <PhoneOutgoing className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white">
                      {editingCampaignId ? 'Edit Campaign' : 'Create Campaign'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Step {campaignStep} of 3</p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowCreateCampaign(false); resetCampaignForm(); }}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Step indicator */}
              <div className="px-6 pt-4 pb-2 flex-shrink-0">
                <div className="flex items-center gap-2">
                  {([1, 2, 3] as const).map((s) => (
                    <React.Fragment key={s}>
                      <div className={`flex items-center gap-1.5 text-xs font-medium ${campaignStep >= s ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          campaignStep > s ? 'bg-indigo-600 text-white'
                          : campaignStep === s ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                        }`}>
                          {campaignStep > s ? <Check className="w-3 h-3" /> : s}
                        </div>
                        <span className="hidden sm:inline">{s === 1 ? 'Setup' : s === 2 ? 'Contacts' : 'Schedule'}</span>
                      </div>
                      {s < 3 && (
                        <div className={`flex-1 h-px ${campaignStep > s ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Step content */}
              <div className="flex-1 overflow-y-auto p-6">
                <AnimatePresence mode="wait">

                  {/* ── Step 1: Campaign Setup ── */}
                  {campaignStep === 1 && (
                    <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            Campaign Name <span className="text-red-500">*</span>
                          </label>
                          <input type="text" value={newCampaign.name}
                            onChange={(e) => setNewCampaign((p) => ({ ...p, name: e.target.value }))}
                            placeholder="e.g., Q3 Lead Follow-up"
                            className="common-bg-icons w-full px-4 py-2.5 rounded-xl text-sm" />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            Agent Number <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={newCampaign.callerNumber}
                            onChange={(e) => {
                              const num = campaignCallerNumbers.find((n) => n.number === e.target.value);
                              // Agent number drives the agent — auto-fill from the number's outbound agent
                              setNewCampaign((p) => ({
                                ...p,
                                callerNumber: e.target.value,
                                agentId: num?.outboundAgentId || '',
                              }));
                            }}
                            className="common-bg-icons w-full px-4 py-2.5 rounded-xl text-sm"
                          >
                            <option value="">Select number…</option>
                            {campaignCallerNumbers.map((n) => (
                              <option key={n.id} value={n.number}>{n.number} — {n.friendlyName}</option>
                            ))}
                          </select>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                            Only outbound-enabled numbers that already have an outbound agent appear here.
                            {campaignCallerNumbers.length === 0 && ' Set an outbound agent on a number in the Outbound Numbers list above.'}
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            AI Agent
                          </label>
                          {selectedCallerNum ? (
                            <div className="w-full px-4 py-2.5 rounded-xl text-sm bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                              <Bot className="w-4 h-4 flex-shrink-0" />
                              <span className="font-medium truncate">
                                {agents.find((a) => a.id === selectedCallerNum.outboundAgentId)?.name || 'Assigned agent'}
                              </span>
                            </div>
                          ) : (
                            <div className="w-full px-4 py-2.5 rounded-xl text-sm common-bg-icons text-slate-400 dark:text-slate-500">
                              Determined by the selected number
                            </div>
                          )}
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                            The campaign uses this number's outbound agent.
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div>
                            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Objective &amp; goal</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              Tell the agent why it is calling and what a successful outcome looks like.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={generateCampaignBriefWithAI}
                            disabled={isGeneratingCampaignBrief || !newCampaign.agentId}
                            title={
                              !newCampaign.agentId
                                ? 'Select an agent number with an outbound agent first'
                                : 'Generate from the selected agent’s template'
                            }
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium common-button-bg2 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                          >
                            {isGeneratingCampaignBrief ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5" />
                            )}
                            {isGeneratingCampaignBrief ? 'Generating…' : 'Generate using AI'}
                          </button>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            Objective
                          </label>
                          <textarea
                            value={newCampaign.objective}
                            onChange={(e) => setNewCampaign((p) => ({ ...p, objective: e.target.value }))}
                            rows={6}
                            placeholder={"• Reconnect with a lead who already expressed interest\n• Confirm interest and preferred location\n• Qualify budget / timeline and schedule next step"}
                            className="common-bg-icons w-full px-4 py-2.5 rounded-xl text-sm resize-y min-h-[120px]"
                          />
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                            Bullet steps for the call. Example: reconnect → confirm interest → qualify → book meeting with the team.
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            Goal
                          </label>
                          <textarea
                            value={newCampaign.goal}
                            onChange={(e) => setNewCampaign((p) => ({ ...p, goal: e.target.value }))}
                            rows={4}
                            placeholder="Connect with the prospect, understand their requirements, answer questions, build confidence, and schedule the next step with your team."
                            className="common-bg-icons w-full px-4 py-2.5 rounded-xl text-sm resize-y min-h-[96px]"
                          />
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                            Overall outcome for a successful call — consultative, not pushy.
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Language</h4>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            Campaign language
                          </label>
                          <select
                            value={newCampaign.language}
                            onChange={(e) => setNewCampaign((p) => ({ ...p, language: e.target.value }))}
                            disabled={!newCampaign.agentId || agentLanguagesLoading || agentLanguageOptions.length === 0}
                            className="common-bg-icons w-full sm:max-w-sm px-4 py-2.5 rounded-xl text-sm disabled:opacity-60"
                          >
                            {!newCampaign.agentId && <option value="">Select an agent number first…</option>}
                            {agentLanguagesLoading && <option value={newCampaign.language}>Loading languages…</option>}
                            {!agentLanguagesLoading &&
                              agentLanguageOptions.map((lang) => (
                                <option key={lang.value} value={lang.value}>
                                  {lang.label} ({lang.value})
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* ── Step 2: Contacts ── */}
                  {campaignStep === 2 && (
                    <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-5">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-800 dark:text-white">Add contacts</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Add one number, paste a list, upload a file, or reuse contacts from past campaigns.
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1 common-bg-icons rounded-xl p-1 w-full sm:w-fit">
                          {([
                            { id: 'single' as const, label: 'Single Number' },
                            { id: 'bulk' as const, label: 'Bulk Paste' },
                            { id: 'file' as const, label: 'Upload File' },
                            { id: 'previous' as const, label: 'Previous Contacts' },
                          ]).map((m) => (
                            <button
                              key={m.id}
                              onClick={() => setContactMode(m.id)}
                              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                                contactMode === m.id ? 'common-button-bg2 shadow-sm' : 'text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {m.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {contactMode === 'file' ? (
                        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 space-y-4">
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Spreadsheet columns:{' '}
                            <code className="font-mono text-slate-700 dark:text-slate-300">phone_number</code> (required),{' '}
                            <code className="font-mono text-slate-700 dark:text-slate-300">name</code>,{' '}
                            <code className="font-mono text-slate-700 dark:text-slate-300">call_context</code>, plus any extra columns as custom fields.
                          </p>
                          {!contactFile ? (
                            <label className="flex flex-col items-center justify-center gap-2 py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                              <Upload className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                Click to choose a .xlsx, .xls or .csv file
                              </span>
                              <span className="text-xs text-slate-400">Uploaded files can be opened and edited before launch</span>
                              <input
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                className="hidden"
                                onChange={(e) => setContactFile(e.target.files?.[0] || null)}
                              />
                            </label>
                          ) : (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                              <button
                                type="button"
                                onClick={openContactFileEditor}
                                className="flex items-center gap-3 flex-1 min-w-0 text-left group"
                                title="Open and edit file"
                              >
                                <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center flex-shrink-0 group-hover:border-indigo-400 transition-colors">
                                  <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 truncate underline-offset-2 group-hover:underline">
                                    {contactFile.name}
                                  </p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    {(contactFile.size / 1024).toFixed(1)} KB · Click to open &amp; edit
                                  </p>
                                </div>
                              </button>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={openContactFileEditor}
                                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium common-button-bg2"
                                >
                                  <Eye className="w-3.5 h-3.5" /> Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={downloadContactFile}
                                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700"
                                >
                                  <Download className="w-3.5 h-3.5" /> Download
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setContactFile(null)}
                                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                                >
                                  <X className="w-3.5 h-3.5" /> Remove
                                </button>
                              </div>
                            </div>
                          )}
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            Contacts are uploaded to the campaign when you launch. The count is confirmed by the server.
                          </p>
                        </div>
                      ) : contactMode === 'single' ? (
                        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 space-y-4">
                          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                            <div className="flex-1 w-full min-w-0">
                              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">Phone Number</label>
                              <div className={`flex common-bg-icons rounded-xl overflow-hidden ${phoneInputError ? 'ring-2 ring-rose-400/40 border-rose-300' : ''}`}>
                                <select
                                  value={selectedCountryId}
                                  onChange={(e) => {
                                    setSelectedCountryId(e.target.value);
                                    setPhoneInputError(null);
                                    setSingleContact((p) => ({
                                      ...p,
                                      phone: sanitizeNationalNumber(
                                        p.phone,
                                        COUNTRY_CODES.find((c) => c.id === e.target.value) ?? COUNTRY_CODES[0]
                                      ),
                                    }));
                                  }}
                                  className="bg-transparent w-[5.5rem] sm:w-[6.25rem] pl-2 pr-1 py-2.5 text-sm border-r border-slate-200 dark:border-slate-700 focus:outline-none text-slate-700 dark:text-slate-300 cursor-pointer flex-shrink-0"
                                  title={selectedCountry.name}
                                >
                                  {COUNTRY_CODES.map((c) => (
                                    <option key={c.id} value={c.id}>
                                      {c.flag} {c.code}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  type="tel"
                                  inputMode="numeric"
                                  value={singleContact.phone}
                                  maxLength={selectedCountry.maxLen}
                                  onChange={(e) => {
                                    setPhoneInputError(null);
                                    setSingleContact((p) => ({
                                      ...p,
                                      phone: sanitizeNationalNumber(e.target.value, selectedCountry),
                                    }));
                                  }}
                                  placeholder={`${selectedCountry.maxLen}-digit number`}
                                  onKeyDown={(e) => e.key === 'Enter' && handleAddSingleContact()}
                                  className="flex-1 bg-transparent px-3 py-2.5 text-sm focus:outline-none text-slate-800 dark:text-white placeholder-slate-400 min-w-0"
                                />
                              </div>
                              {phoneInputError ? (
                                <p className="text-xs text-rose-500 mt-1">{phoneInputError}</p>
                              ) : (
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                  Max {selectedCountry.maxLen} digits · {selectedCountry.flag} {selectedCountry.name}
                                </p>
                              )}
                            </div>
                            <div className="flex-1 w-full min-w-0">
                              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">Name (optional)</label>
                              <input
                                type="text"
                                value={singleContact.name}
                                onChange={(e) => setSingleContact((p) => ({ ...p, name: e.target.value }))}
                                placeholder="Contact name"
                                className="common-bg-icons w-full px-4 py-2.5 rounded-xl text-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">Call context (optional)</label>
                            <textarea
                              value={singleContact.context}
                              onChange={(e) => setSingleContact((p) => ({ ...p, context: e.target.value }))}
                              placeholder="e.g. Follow-up on pricing inquiry, previous demo request, interested in franchise in Mumbai…"
                              rows={3}
                              className="common-bg-icons w-full px-4 py-2.5 rounded-xl text-sm resize-y min-h-[80px]"
                            />
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                              Notes for the agent about why you&apos;re calling this contact.
                            </p>
                          </div>
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={handleAddSingleContact}
                              className="common-button-bg !px-3.5 !py-2.5 !min-w-[44px] rounded-xl inline-flex items-center justify-center"
                              title="Add contact"
                              aria-label="Add contact"
                            >
                              <Plus className="w-5 h-5 text-white shrink-0" strokeWidth={2.5} />
                            </button>
                          </div>
                        </div>
                      ) : contactMode === 'previous' ? (
                        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-start gap-2 min-w-0">
                              <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center flex-shrink-0">
                                <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-800 dark:text-white">From contact list</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  Reuse saved tenant contacts for this campaign.
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="search"
                                value={previousContactSearch}
                                onChange={(e) => setPreviousContactSearch(e.target.value)}
                                placeholder="Search phone or name…"
                                className="common-bg-icons px-3 py-2 rounded-xl text-sm w-full sm:w-56"
                              />
                              <button
                                type="button"
                                onClick={loadPreviousContacts}
                                disabled={previousContactsLoading}
                                className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 whitespace-nowrap"
                              >
                                Refresh
                              </button>
                            </div>
                          </div>

                          {previousContactsError && (
                            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
                              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-rose-600 dark:text-rose-400 flex-1">{previousContactsError}</p>
                              <button type="button" onClick={loadPreviousContacts} className="text-xs text-rose-600 underline">
                                Retry
                              </button>
                            </div>
                          )}

                          {previousContactsLoading ? (
                            <div className="flex items-center justify-center py-12 gap-2 text-slate-400">
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span className="text-sm">Loading previous contacts…</span>
                            </div>
                          ) : filteredPreviousContacts.length === 0 ? (
                            <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                              <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                {previousContactSearch.trim()
                                  ? 'No contacts match your search'
                                  : 'No previous campaign contacts found yet'}
                              </p>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center justify-between gap-2">
                                <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={
                                      filteredPreviousContacts.length > 0 &&
                                      filteredPreviousContacts.every((c) => selectedPreviousIds.has(c._id))
                                    }
                                    onChange={toggleAllVisiblePrevious}
                                    className="rounded border-slate-300"
                                  />
                                  Select all visible ({filteredPreviousContacts.length})
                                </label>
                                <span className="text-xs text-slate-400">
                                  {selectedPreviousIds.size} selected
                                </span>
                              </div>
                              <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredPreviousContacts.map((c) => {
                                  const already =
                                    campaignContacts.some(
                                      (x) => x.phone.replace(/\D/g, '') === String(c.phone_number || '').replace(/\D/g, '')
                                    );
                                  return (
                                    <label
                                      key={c._id}
                                      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                                        already ? 'opacity-60' : ''
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selectedPreviousIds.has(c._id)}
                                        onChange={() => togglePreviousContact(c._id)}
                                        className="rounded border-slate-300"
                                      />
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="text-sm font-mono font-medium text-slate-800 dark:text-white">
                                            {c.phone_number}
                                          </span>
                                          {c.name && (
                                            <span className="text-xs text-slate-500 dark:text-slate-400">{c.name}</span>
                                          )}
                                          {already && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                                              Already added
                                            </span>
                                          )}
                                        </div>
                                        {c.status && (
                                          <p className="text-[11px] text-slate-400 mt-0.5 capitalize">
                                            Last status: {String(c.status).replace(/_/g, ' ')}
                                          </p>
                                        )}
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                              <button
                                type="button"
                                onClick={addSelectedPreviousContacts}
                                disabled={selectedPreviousIds.size === 0}
                                className="common-button-bg inline-flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl disabled:opacity-50"
                              >
                                <Plus className="w-4 h-4" />
                                Add selected to campaign
                              </button>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 space-y-3">
                          <label className="block text-xs text-slate-500 dark:text-slate-400">
                            One number per line — optionally:{' '}
                            <code className="font-mono">+1234567890, Name, Call context</code>
                          </label>
                          <textarea
                            value={bulkInput}
                            onChange={(e) => setBulkInput(e.target.value)}
                            rows={8}
                            placeholder={"+14155550123, John Doe, Follow-up on demo request\n+14155550124, Jane Smith\n+14155550125"}
                            className="common-bg-icons w-full px-4 py-3 rounded-xl text-sm font-mono resize-y min-h-[160px]"
                          />
                          <button
                            onClick={parseBulkContacts}
                            className="common-button-bg2 inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl"
                          >
                            <Upload className="w-4 h-4" /> Parse &amp; Preview
                          </button>
                        </div>
                      )}

                      {contactMode !== 'file' && (
                        campaignContacts.length > 0 ? (
                          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/40">
                              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                {campaignContacts.length} contact{campaignContacts.length !== 1 ? 's' : ''} added
                              </p>
                              <button
                                onClick={() => setCampaignContacts([])}
                                className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" /> Clear all
                              </button>
                            </div>
                            {/* Desktop table */}
                            <div className="hidden lg:block max-h-64 overflow-auto">
                              <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                                  <tr className="text-left text-xs text-slate-500 dark:text-slate-400">
                                    <th className="px-4 py-2.5 font-medium">Phone</th>
                                    <th className="px-4 py-2.5 font-medium">Name</th>
                                    <th className="px-4 py-2.5 font-medium">Call context</th>
                                    <th className="px-4 py-2.5 font-medium w-12" />
                                  </tr>
                                </thead>
                                <tbody>
                                  {campaignContacts.map((c) => (
                                    <tr
                                      key={c.id}
                                      className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                                    >
                                      <td className="px-4 py-2.5 font-mono text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                        {c.phone}
                                      </td>
                                      <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">
                                        {c.name || '—'}
                                      </td>
                                      <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 max-w-xs truncate" title={c.context}>
                                        {c.context || '—'}
                                      </td>
                                      <td className="px-4 py-2.5 text-right">
                                        <button
                                          onClick={() => setCampaignContacts((p) => p.filter((x) => x.id !== c.id))}
                                          className="text-slate-400 hover:text-red-500"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            {/* Mobile list */}
                            <div className="lg:hidden max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                              {campaignContacts.map((c) => (
                                <div key={c.id} className="flex items-center justify-between px-4 py-3">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                      <span className="text-sm text-slate-700 dark:text-slate-300 font-mono">{c.phone}</span>
                                      {c.name && <span className="text-xs text-slate-500">— {c.name}</span>}
                                    </div>
                                    {c.context && (
                                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 pl-6 truncate" title={c.context}>
                                        {c.context}
                                      </p>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => setCampaignContacts((p) => p.filter((x) => x.id !== c.id))}
                                    className="text-slate-400 hover:text-red-500 ml-2 flex-shrink-0"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                            <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No contacts added yet</p>
                            <p className="text-xs text-slate-400 mt-1">Add at least one contact to continue</p>
                          </div>
                        )
                      )}
                    </motion.div>
                  )}

                  {/* ── Step 3: Schedule, controls & review ── */}
                  {campaignStep === 3 && (
                    <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-5">
                      <CampaignScheduleForm value={schedule} onChange={setSchedule} />

                      {/* Summary */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Campaign Summary</h4>
                        <div className="space-y-2 text-sm">
                          {[
                            { label: 'Name', value: newCampaign.name },
                            { label: 'Agent Name', value: agents.find((a) => a.id === newCampaign.agentId)?.name || '—' },
                            { label: 'Agent Number', value: newCampaign.callerNumber || 'Not set' },
                            { label: 'Objective', value: newCampaign.objective.trim() || '—' },
                            { label: 'Goal', value: newCampaign.goal.trim() || '—' },
                            { label: 'Language', value: languageLabel(newCampaign.language) },
                            { label: 'Contacts', value: contactMode === 'file' ? (contactFile?.name || (editingCampaignId ? 'Unchanged' : 'file')) : `${campaignContacts.length || (editingCampaignId ? 'Unchanged' : 0)}` },
                            {
                              label: 'Launch',
                              value: schedule.startNow
                                ? 'Start now'
                                : schedule.scheduledAt
                                  ? `Scheduled · ${new Date(schedule.scheduledAt).toLocaleString()}`
                                  : 'Pick a schedule',
                            },
                            { label: 'Timezone', value: schedule.timezone },
                            { label: 'Window', value: `${schedule.windowStart} – ${schedule.windowEnd}` },
                            { label: 'Working days', value: schedule.workingDays.join(', ') || '—' },
                            { label: 'Pacing', value: `${schedule.maxConcurrent} concurrent · ${schedule.callsPerMinute}/min · ${schedule.dailyLimit}/day · ${schedule.priority}` },
                          ].map(({ label, value }) => (
                            <div key={label} className="flex justify-between">
                              <span className="text-slate-500 dark:text-slate-400">{label}</span>
                              <span className="font-medium text-slate-800 dark:text-white text-right ml-4 max-w-[260px] truncate">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {wizardError && (
                        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-red-600 dark:text-red-400">{wizardError}</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="flex gap-3 p-6 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
                {campaignStep > 1 ? (
                  <button onClick={() => setCampaignStep((s) => (s - 1) as 1 | 2 | 3)} className="common-button-bg2 px-5 py-2.5 rounded-xl text-sm">
                    Back
                  </button>
                ) : (
                  <button onClick={() => { setShowCreateCampaign(false); resetCampaignForm(); }} className="common-button-bg2 px-5 py-2.5 rounded-xl text-sm">
                    Cancel
                  </button>
                )}
                <div className="flex-1" />
                {campaignStep < 3 ? (
                  <button
                    onClick={() => setCampaignStep((s) => (s + 1) as 1 | 2 | 3)}
                    disabled={campaignStep === 1 ? !step1Valid : !step2Valid}
                    className="common-button-bg px-6 py-2.5 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    Continue <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleLaunchCampaign}
                    disabled={
                      isSavingCampaign ||
                      !step1Valid ||
                      !step2Valid ||
                      (!schedule.startNow && !schedule.scheduledAt)
                    }
                    className="common-button-bg px-6 py-2.5 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSavingCampaign ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> {wizardStage || 'Saving…'}</>
                    ) : editingCampaignId ? (
                      <><Check className="w-4 h-4" /> Save Campaign</>
                    ) : schedule.startNow ? (
                      <><Play className="w-4 h-4" /> Launch Campaign</>
                    ) : (
                      <><Clock className="w-4 h-4" /> Schedule Campaign</>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contact file editor */}
      <AnimatePresence>
        {showContactFileEditor && contactFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100000] flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowContactFileEditor(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-800 dark:text-white truncate">{contactFile.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {isContactFileCsv ? 'Edit CSV contents, then save' : 'Excel files can be downloaded, edited externally, then re-uploaded'}
                  </p>
                </div>
                <button
                  onClick={() => setShowContactFileEditor(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                {contactFileEditLoading ? (
                  <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Loading file…</span>
                  </div>
                ) : isContactFileCsv ? (
                  <textarea
                    value={contactFileEditText}
                    onChange={(e) => setContactFileEditText(e.target.value)}
                    rows={18}
                    spellCheck={false}
                    className="common-bg-icons w-full px-4 py-3 rounded-xl text-sm font-mono resize-y min-h-[320px]"
                  />
                ) : (
                  <div className="text-center py-10 space-y-4">
                    <FileSpreadsheet className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                    <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                      In-browser editing is available for CSV. Download this spreadsheet, edit it, then replace the upload on the Contacts step.
                    </p>
                    <button
                      type="button"
                      onClick={downloadContactFile}
                      className="common-button-bg2 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
                    >
                      <Download className="w-4 h-4" /> Download file
                    </button>
                    <div>
                      <label className="inline-flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline">
                        <Upload className="w-4 h-4" /> Replace with edited file
                        <input
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              setContactFile(f);
                              setShowContactFileEditor(false);
                              appToast.success('File replaced');
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 p-5 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
                <button
                  onClick={() => setShowContactFileEditor(false)}
                  className="px-4 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Close
                </button>
                {isContactFileCsv && (
                  <button
                    onClick={saveContactFileEdits}
                    className="common-button-bg px-4 py-2 rounded-xl text-sm inline-flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Save changes
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
        </>,
        document.body
      )}
    </div>
  );
};

// ─── Inbound Routing Rules Modal ──────────────────────────────────────────────

interface InboundRulesModalProps {
  number: PhoneNumber;
  existingRule?: InboundRule;
  onSave: (rule: InboundRule) => void;
  onClose: () => void;
}

const InboundRulesModal: React.FC<InboundRulesModalProps> = ({ number, existingRule, onSave, onClose }) => {
  const [rule, setRule] = useState<InboundRule>(
    existingRule ?? {
      numberId: number.id,
      recordCalls: true,
      maxConcurrent: 5,
      businessHours: { enabled: false, start: '09:00', end: '18:00', timezone: 'Asia/Kolkata' },
      fallback: 'voicemail',
      fallbackNumber: '',
    }
  );

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white">Routing Rules</h3>
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">{number.number}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Record calls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Record Calls</span>
            </div>
            <Toggle checked={rule.recordCalls} onChange={() => setRule((r) => ({ ...r, recordCalls: !r.recordCalls }))} />
          </div>

          {/* Max concurrent */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Max Concurrent Calls</label>
            <input type="number" min={1} max={50} value={rule.maxConcurrent}
              onChange={(e) => setRule((r) => ({ ...r, maxConcurrent: +e.target.value }))}
              className="common-bg-icons w-full px-4 py-2.5 rounded-xl text-sm" />
          </div>

          {/* Business hours */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Business Hours Only</span>
              </div>
              <Toggle
                checked={rule.businessHours.enabled}
                onChange={() => setRule((r) => ({ ...r, businessHours: { ...r.businessHours, enabled: !r.businessHours.enabled } }))}
              />
            </div>
            {rule.businessHours.enabled && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Open</label>
                  <input type="time" value={rule.businessHours.start}
                    onChange={(e) => setRule((r) => ({ ...r, businessHours: { ...r.businessHours, start: e.target.value } }))}
                    className="common-bg-icons w-full px-3 py-2 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Close</label>
                  <input type="time" value={rule.businessHours.end}
                    onChange={(e) => setRule((r) => ({ ...r, businessHours: { ...r.businessHours, end: e.target.value } }))}
                    className="common-bg-icons w-full px-3 py-2 rounded-xl text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Timezone</label>
                  <select value={rule.businessHours.timezone}
                    onChange={(e) => setRule((r) => ({ ...r, businessHours: { ...r.businessHours, timezone: e.target.value } }))}
                    className="common-bg-icons w-full px-3 py-2 rounded-xl text-sm">
                    {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                  </select>
                </div>
              </motion.div>
            )}
          </div>

          {/* Fallback */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Fallback Behavior
            </label>
            <div className="space-y-2">
              {([
                { id: 'voicemail', label: 'Voicemail',          desc: 'Play a voicemail greeting',        icon: MicOff     },
                { id: 'transfer',  label: 'Transfer to Human',  desc: 'Forward to a phone number',        icon: PhoneCall  },
                { id: 'busy',      label: 'Busy Signal',        desc: 'Reject the call immediately',      icon: PhoneMissed },
              ] as const).map((opt) => (
                <label key={opt.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    rule.fallback === opt.id
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-slate-200 dark:border-slate-700 common-bg-icons'
                  }`}>
                  <input type="radio" name="fallback" value={opt.id} checked={rule.fallback === opt.id}
                    onChange={() => setRule((r) => ({ ...r, fallback: opt.id }))}
                    className="accent-indigo-600" />
                  <opt.icon className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-white">{opt.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
            {rule.fallback === 'transfer' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3">
                <input type="tel" value={rule.fallbackNumber ?? ''}
                  onChange={(e) => setRule((r) => ({ ...r, fallbackNumber: e.target.value }))}
                  placeholder="Transfer to: +1 (555) 000-0000"
                  className="common-bg-icons w-full px-4 py-2.5 rounded-xl text-sm" />
              </motion.div>
            )}
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
          <button onClick={onClose} className="common-button-bg2 flex-1 py-2.5 rounded-xl text-sm">Cancel</button>
          <button onClick={() => onSave(rule)} className="common-button-bg flex-1 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
            <Check className="w-4 h-4" /> Save Rules
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
};

export default CallSetup;
