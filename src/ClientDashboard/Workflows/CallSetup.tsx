import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../../components/GlassCard';
import appToast from '../../components/AppToast';
import { useAgent } from '../../contexts/AgentContext';
import { agentAPI } from '../../services/agentAPI';
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
  uploadCampaignContacts,
  startCampaign,
  pauseCampaign,
  resumeCampaign,
  stopCampaign,
  deleteCampaign,
  getCampaigns,
  getCampaignStatus,
  contactsToCsvFile,
  formatDid,
  type CatalogNumber,
  type ProvisionedNumber,
  type Campaign,
  type CampaignLiveStatus,
  type DidType,
} from '../../services/phoneNumbersAPI';
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
} from 'lucide-react';

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
}

const TIMEZONES = [
  'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Asia/Tokyo',
  'Europe/London', 'Europe/Berlin', 'Europe/Paris',
  'America/New_York', 'America/Chicago', 'America/Los_Angeles',
  'Australia/Sydney', 'Pacific/Auckland',
];

const COUNTRY_CODES = [
  { id: 'IN',  code: '+91',  flag: '🇮🇳', name: 'India'           },
  { id: 'US',  code: '+1',   flag: '🇺🇸', name: 'United States'   },
  { id: 'CA',  code: '+1',   flag: '🇨🇦', name: 'Canada'          },
  { id: 'GB',  code: '+44',  flag: '🇬🇧', name: 'United Kingdom'  },
  { id: 'AU',  code: '+61',  flag: '🇦🇺', name: 'Australia'       },
  { id: 'AE',  code: '+971', flag: '🇦🇪', name: 'UAE'             },
  { id: 'SA',  code: '+966', flag: '🇸🇦', name: 'Saudi Arabia'    },
  { id: 'SG',  code: '+65',  flag: '🇸🇬', name: 'Singapore'       },
  { id: 'MY',  code: '+60',  flag: '🇲🇾', name: 'Malaysia'        },
  { id: 'PH',  code: '+63',  flag: '🇵🇭', name: 'Philippines'     },
  { id: 'PK',  code: '+92',  flag: '🇵🇰', name: 'Pakistan'        },
  { id: 'BD',  code: '+880', flag: '🇧🇩', name: 'Bangladesh'      },
  { id: 'LK',  code: '+94',  flag: '🇱🇰', name: 'Sri Lanka'       },
  { id: 'NP',  code: '+977', flag: '🇳🇵', name: 'Nepal'           },
  { id: 'DE',  code: '+49',  flag: '🇩🇪', name: 'Germany'         },
  { id: 'FR',  code: '+33',  flag: '🇫🇷', name: 'France'          },
  { id: 'IT',  code: '+39',  flag: '🇮🇹', name: 'Italy'           },
  { id: 'ES',  code: '+34',  flag: '🇪🇸', name: 'Spain'           },
  { id: 'NL',  code: '+31',  flag: '🇳🇱', name: 'Netherlands'     },
  { id: 'JP',  code: '+81',  flag: '🇯🇵', name: 'Japan'           },
  { id: 'KR',  code: '+82',  flag: '🇰🇷', name: 'South Korea'     },
  { id: 'CN',  code: '+86',  flag: '🇨🇳', name: 'China'           },
  { id: 'BR',  code: '+55',  flag: '🇧🇷', name: 'Brazil'          },
  { id: 'MX',  code: '+52',  flag: '🇲🇽', name: 'Mexico'          },
  { id: 'ZA',  code: '+27',  flag: '🇿🇦', name: 'South Africa'    },
  { id: 'NG',  code: '+234', flag: '🇳🇬', name: 'Nigeria'         },
  { id: 'KE',  code: '+254', flag: '🇰🇪', name: 'Kenya'           },
  { id: 'EG',  code: '+20',  flag: '🇪🇬', name: 'Egypt'           },
  { id: 'TR',  code: '+90',  flag: '🇹🇷', name: 'Turkey'          },
  { id: 'RU',  code: '+7',   flag: '🇷🇺', name: 'Russia'          },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const statusBadge = (status: string) => {
  const map: Record<string, { label: string; cls: string }> = {
    draft:     { label: 'Draft',     cls: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300' },
    scheduled: { label: 'Scheduled', cls: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
    running:   { label: 'Running',   cls: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
    paused:    { label: 'Paused',    cls: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' },
    completed: { label: 'Completed', cls: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' },
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
  const { agents, isLoading: agentsLoading } = useAgent();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeSection, setActiveSection] = useState<'inbound' | 'outbound'>(() =>
    (location.state as { callSetupSection?: string } | null)?.callSetupSection === 'outbound'
      ? 'outbound'
      : 'inbound'
  );

  // ── Inbound state ──
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
  const [numbersLoading, setNumbersLoading] = useState(true);
  const [numbersError, setNumbersError] = useState<string | null>(null);
  const [assignModal, setAssignModal] = useState<PhoneNumber | null>(null);
  const [rulesModal, setRulesModal] = useState<PhoneNumber | null>(null);
  const [inboundRules, setInboundRules] = useState<Record<string, InboundRule>>({});
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // ── Buy-number state ──
  const [showBuyModal, setShowBuyModal] = useState(false);
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

  // ── Outbound-agent assignment (inline per-number select) ──
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
  const [contactMode, setContactMode] = useState<'single' | 'bulk' | 'file'>('single');
  const [bulkInput, setBulkInput] = useState('');
  const [singleContact, setSingleContact] = useState({ phone: '', name: '', context: '' });
  const [selectedCountryId, setSelectedCountryId] = useState('IN');
  const selectedCountry = COUNTRY_CODES.find((c) => c.id === selectedCountryId) ?? COUNTRY_CODES[0];
  const [campaignContacts, setCampaignContacts] = useState<ContactEntry[]>([]);
  const [contactFile, setContactFile] = useState<File | null>(null);
  const [isSavingCampaign, setIsSavingCampaign] = useState(false);
  const [wizardError, setWizardError] = useState<string | null>(null);
  const [wizardStage, setWizardStage] = useState<string>(''); // progress text while launching
  const [startNow, setStartNow] = useState(true);
  const [isGeneratingCampaignBrief, setIsGeneratingCampaignBrief] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    agentId: '',
    callerNumber: '',
    language: 'en-in',
    maxConcurrent: 3,
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
    if (!window.confirm(
      `Detach the AI employee from ${num.number}?\n\nThe number stays on your account but inbound calls will no longer reach an agent until you assign one again.`
    )) return;
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

  // Inline outbound-agent picker change. Empty value → remove agent (DELETE),
  // otherwise set/replace (POST /outbound-agent). Requires outbound enabled.
  const handleOutboundAgentChange = async (num: PhoneNumber, agentId: string) => {
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
      } else {
        await removeOutboundAgent(num.id);
        setNumbers((prev) =>
          prev.map((n) => (n.id === num.id ? { ...n, outboundAgentId: null } : n))
        );
        appToast.success(`Outbound agent removed from ${num.number}`);
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
    const raw = singleContact.phone.trim();
    if (!raw) return;
    const stripped = raw.startsWith('+') ? raw.slice(1) : raw;
    const fullPhone = `${selectedCountry.code}${stripped}`;
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

  // Load campaigns the first time the user opens the Outbound tab
  useEffect(() => {
    if (activeSection === 'outbound' && campaigns.length === 0 && !campaignsLoading) {
      loadCampaigns();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection]);

  // Poll live status while any campaign is running
  useEffect(() => {
    if (activeSection !== 'outbound') return;
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

  // Create → upload contacts → optionally start. Matches the required API order.
  const handleLaunchCampaign = async () => {
    if (!step1Valid || !step2Valid) return;
    setIsSavingCampaign(true);
    setWizardError(null);
    try {
      setWizardStage('Creating campaign…');
      const created = await createCampaign({
        agent_id: newCampaign.agentId,
        name: newCampaign.name.trim(),
        caller_number: newCampaign.callerNumber,
        language: newCampaign.language,
        max_concurrent: newCampaign.maxConcurrent,
        ...(newCampaign.objective.trim() ? { objective: newCampaign.objective.trim() } : {}),
        ...(newCampaign.goal.trim() ? { goal: newCampaign.goal.trim() } : {}),
      });

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
      await uploadCampaignContacts(created._id, file);

      if (startNow) {
        setWizardStage('Starting dialer…');
        await startCampaign(created._id);
      }

      setShowCreateCampaign(false);
      resetCampaignForm();
      appToast.success(
        startNow
          ? `Campaign "${created.name}" launched`
          : `Campaign "${created.name}" created`
      );
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
    setStartNow(true);
    setWizardError(null);
    setNewCampaign({ name: '', agentId: '', callerNumber: '', language: 'en-in', maxConcurrent: 3, objective: '', goal: '' });
  };

  const openCampaignWizard = () => {
    resetCampaignForm();
    setShowCreateCampaign(true);
  };

  const generateCampaignBriefWithAI = async () => {
    const agent = agents.find((a) => a.id === newCampaign.agentId);
    if (!agent) {
      appToast.error('Select a caller number (with an outbound agent) first');
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

  // Start (draft) / pause / resume / stop / delete
  const handleCampaignAction = async (
    id: string,
    action: 'pause' | 'resume' | 'start' | 'stop' | 'delete',
    e?: React.MouseEvent
  ) => {
    e?.stopPropagation();
    setCampaignActionId(id);
    setCampaignsError(null);
    try {
      if (action === 'pause') {
        await pauseCampaign(id);
        setCampaigns((prev) => prev.map((c) => (c._id === id ? { ...c, status: 'paused' } : c)));
        appToast.success('Campaign paused');
      } else if (action === 'resume') {
        await resumeCampaign(id);
        setCampaigns((prev) => prev.map((c) => (c._id === id ? { ...c, status: 'running' } : c)));
        appToast.success('Campaign resumed');
      } else if (action === 'start') {
        await startCampaign(id);
        setCampaigns((prev) => prev.map((c) => (c._id === id ? { ...c, status: 'running' } : c)));
        appToast.success('Campaign started');
      } else if (action === 'stop') {
        await stopCampaign(id);
        setCampaigns((prev) => prev.map((c) => (c._id === id ? { ...c, status: 'stopped' } : c)));
        appToast.success('Campaign stopped');
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
  const step2Valid = contactMode === 'file' ? !!contactFile : campaignContacts.length > 0;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* Top bar: title + section toggle */}
      <GlassCard>
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Call Setup</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Manage inbound routing and outbound calling campaigns for your AI agents
            </p>
          </div>
          <div className="flex gap-1 common-bg-icons rounded-xl p-1 self-start sm:self-auto">
            {([
              { id: 'inbound',  label: 'Inbound',  icon: PhoneIncoming  },
              { id: 'outbound', label: 'Outbound', icon: PhoneOutgoing },
            ] as const).map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeSection === s.id
                    ? 'common-button-bg2 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <s.icon className="w-4 h-4" />
                {s.label}
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
                    Buy Number
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
                    const agent = agents.find((a) => a.id === num.assignedAgentId);
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
                          {agent ? (
                            <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 px-2.5 py-1.5 rounded-lg text-xs font-medium truncate max-w-[140px]">
                              <Bot className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">{agent.name}</span>
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
                              title={agent ? 'Change inbound agent' : 'Assign inbound agent'}
                              className="text-xs common-button-bg2 px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1 whitespace-nowrap"
                            >
                              <Bot className="w-3 h-3" />
                              <span className="hidden xs:inline sm:inline">{agent ? 'Change' : 'Assign'}</span>
                              <span className="xs:hidden sm:hidden">{agent ? '↺' : '+'}</span>
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
                                onClick={() => handleDeprovision(num)}
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
                { label: 'Total Campaigns', value: campaigns.length,                                               icon: Zap,       color: 'from-blue-500 to-indigo-600'   },
                { label: 'Running',         value: campaigns.filter((c) => c.status === 'running').length,         icon: Play,      color: 'from-green-500 to-emerald-600'  },
                { label: 'Contacts Completed', value: campaigns.reduce((s, c) => s + (c.live?.completed || c.stats?.completed || 0), 0), icon: PhoneCall, color: 'from-purple-500 to-pink-600'   },
                { label: 'Pending',         value: campaigns.reduce((s, c) => s + (c.live?.pending || c.stats?.pending || 0), 0),      icon: Clock,     color: 'from-orange-500 to-amber-600'  },
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
                              // Inline agent picker — saves on change; empty = remove agent
                              <div className="flex items-center gap-2 w-full sm:w-auto">
                                <label className="text-xs text-slate-400 dark:text-slate-500 hidden sm:inline">Agent</label>
                                <div className="relative flex-1 sm:flex-none">
                                  <select
                                    value={num.outboundAgentId || ''}
                                    disabled={busy || agentsLoading}
                                    onChange={(e) => handleOutboundAgentChange(num, e.target.value)}
                                    className="common-bg-icons w-full sm:w-52 px-3 py-2 rounded-lg text-sm disabled:opacity-60 appearance-none pr-8"
                                  >
                                    <option value="">— No agent —</option>
                                    {agents.map((a) => (
                                      <option key={a.id} value={a.id}>{a.name}</option>
                                    ))}
                                  </select>
                                  {busy && (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                  )}
                                </div>
                              </div>
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

            {/* Campaigns */}
            <GlassCard>
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <SectionHeader
                    icon={PhoneOutgoing}
                    title="Outbound Campaigns"
                    subtitle="Create AI-powered outbound call campaigns"
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
                    <button
                      onClick={openCampaignWizard}
                      disabled={campaignCallerNumbers.length === 0}
                      title={campaignCallerNumbers.length === 0 ? 'Set an outbound agent on a number first' : 'Create a new campaign'}
                      className="common-button-bg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                      New Campaign
                    </button>
                  </div>
                </div>

                {/* No campaign-ready numbers → guide the user to set an outbound agent first */}
                {!campaignsLoading && campaignCallerNumbers.length === 0 && campaigns.length === 0 && (
                  <div className="mb-4 flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-700 dark:text-amber-300">
                      <p className="font-medium">Set up an outbound number first</p>
                      <p className="text-amber-600 dark:text-amber-400 mt-0.5">
                        A campaign needs a number that is <span className="font-medium">outbound-enabled</span> and has an{' '}
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

                {campaignsLoading && campaigns.length === 0 ? (
                  <div className="flex items-center justify-center py-14 gap-2 text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Loading campaigns…</span>
                  </div>
                ) : campaigns.length === 0 ? (
                  <div className="text-center py-14 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 flex items-center justify-center mx-auto mb-4">
                      <PhoneOutgoing className="w-7 h-7 text-indigo-500" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-2">No campaigns yet</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
                      Create a campaign to start making AI-powered outbound calls to your contacts.
                    </p>
                    <button
                      onClick={openCampaignWizard}
                      disabled={campaignCallerNumbers.length === 0}
                      className="common-button-bg inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" /> Create Campaign
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {campaigns.map((campaign) => {
                      const agent = agents.find((a) => a.id === campaign.agent_id);
                      const live = campaign.live || (campaign.stats as CampaignLiveStatus | undefined);
                      const total = live?.total || 0;
                      const done = (live?.completed || 0) + (live?.no_answer || 0);
                      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                      const busy = campaignActionId === campaign._id;
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
                                <PhoneOutgoing className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base tracking-tight">
                                    {campaign.name}
                                  </h4>
                                  {statusBadge(campaign.status)}
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
                              className="flex items-center gap-1 flex-shrink-0 self-end sm:self-start"
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
                              {campaign.status === 'draft' && (
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
                                  setDeleteCampaignId(campaign._id);
                                }}
                                disabled={busy}
                                title="Delete"
                                className="p-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 border border-transparent hover:border-rose-200 dark:hover:border-rose-800 transition-colors disabled:opacity-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: Assign Agent to Number
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
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white">Assign AI Agent</h3>
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">{assignModal.number}</p>
                </div>
                <button onClick={() => setAssignModal(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Select an agent to handle inbound calls on this number.
                </p>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {/* Loading state */}
                  {agentsLoading && (
                    <div className="flex items-center justify-center py-6 gap-2 text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Loading agents…</span>
                    </div>
                  )}

                  {/* Empty state */}
                  {!agentsLoading && agents.length === 0 && (
                    <div className="text-center py-6">
                      <Bot className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">No agents found. Create an agent first.</p>
                    </div>
                  )}

                  {/* Agent list from real API */}
                  {agents.map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => handleAssignAgent(agent.id)}
                      disabled={!!assigningId}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all disabled:opacity-60 ${
                        assignModal.assignedAgentId === agent.id
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-300 dark:border-emerald-700'
                          : 'common-bg-icons hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{agent.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{agent.language}</p>
                      </div>
                      {assigningId && assignModal.assignedAgentId !== agent.id && (
                        <Loader2 className="w-4 h-4 text-slate-400 animate-spin flex-shrink-0" />
                      )}
                      {assignModal.assignedAgentId === agent.id && (
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      )}
                    </button>
                  ))}
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
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Answering Agent <span className="text-red-500">*</span>
                  </label>
                  {agentsLoading ? (
                    <div className="common-bg-icons w-full px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading agents…
                    </div>
                  ) : (
                    <select
                      value={buyAgentId}
                      onChange={(e) => setBuyAgentId(e.target.value)}
                      className="common-bg-icons w-full px-4 py-2.5 rounded-xl text-sm"
                    >
                      <option value="">Select agent…</option>
                      {agents.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  )}
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
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <PhoneOutgoing className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white">New Outbound Campaign</h3>
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
                        <span className="hidden sm:inline">{s === 1 ? 'Setup' : s === 2 ? 'Contacts' : 'Launch'}</span>
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
                            Caller Number <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={newCampaign.callerNumber}
                            onChange={(e) => {
                              const num = campaignCallerNumbers.find((n) => n.number === e.target.value);
                              // Caller number drives the agent — auto-fill from the number's outbound agent
                              setNewCampaign((p) => ({
                                ...p,
                                callerNumber: e.target.value,
                                agentId: num?.outboundAgentId || '',
                                language: num?.language || p.language,
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
                                ? 'Select a caller number with an outbound agent first'
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
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Dialer Settings</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">Max Concurrent Calls</label>
                            <input type="number" min={1} max={20}
                              value={newCampaign.maxConcurrent}
                              onChange={(e) => setNewCampaign((p) => ({ ...p, maxConcurrent: +e.target.value }))}
                              className="common-bg-icons w-full px-4 py-2.5 rounded-xl text-sm" />
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Simultaneous calls the dialer places. Default 3.</p>
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">Language</label>
                            <input type="text"
                              value={newCampaign.language}
                              onChange={(e) => setNewCampaign((p) => ({ ...p, language: e.target.value }))}
                              placeholder="en-in"
                              className="common-bg-icons w-full px-4 py-2.5 rounded-xl text-sm" />
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">BCP-47 code the agent speaks. Default en-in.</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* ── Step 2: Contacts ── */}
                  {campaignStep === 2 && (
                    <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-4">
                      <div className="flex gap-1 common-bg-icons rounded-xl p-1 w-fit">
                        {(['single', 'bulk', 'file'] as const).map((m) => (
                          <button key={m} onClick={() => setContactMode(m)}
                            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${contactMode === m ? 'common-button-bg2 shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}>
                            {m === 'single' ? 'Single Number' : m === 'bulk' ? 'Bulk Paste' : 'Upload File'}
                          </button>
                        ))}
                      </div>

                      {contactMode === 'file' ? (
                        <div>
                          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                            Spreadsheet — columns: <code className="font-mono">phone_number</code> (required),{' '}
                            <code className="font-mono">name</code>,{' '}
                            <code className="font-mono">call_context</code> (why you&apos;re calling), plus any extra columns as custom fields for the agent.
                          </label>
                          <label className="flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors">
                            <Upload className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                            {contactFile ? (
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{contactFile.name}</span>
                            ) : (
                              <span className="text-sm text-slate-400">Click to choose a .xlsx, .xls or .csv file</span>
                            )}
                            <input
                              type="file"
                              accept=".xlsx,.xls,.csv"
                              className="hidden"
                              onChange={(e) => setContactFile(e.target.files?.[0] || null)}
                            />
                          </label>
                          {contactFile && (
                            <button onClick={() => setContactFile(null)} className="mt-2 text-xs text-red-500 hover:text-red-600 flex items-center gap-1">
                              <X className="w-3 h-3" /> Remove file
                            </button>
                          )}
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                            Contacts are uploaded to the campaign when you launch. The count is confirmed by the server.
                          </p>
                        </div>
                      ) : contactMode === 'single' ? (
                        <div className="flex flex-col sm:flex-row gap-3 items-end">
                          <div className="flex-1 w-full">
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">Phone Number</label>
                            <div className="flex common-bg-icons rounded-xl overflow-hidden">
                              <select
                                value={selectedCountryId}
                                onChange={(e) => setSelectedCountryId(e.target.value)}
                                className="bg-transparent pl-3 pr-1 py-2.5 text-sm border-r border-slate-200 dark:border-slate-700 focus:outline-none text-slate-700 dark:text-slate-300 cursor-pointer flex-shrink-0"
                              >
                                {COUNTRY_CODES.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.flag} {c.code} ({c.name})
                                  </option>
                                ))}
                              </select>
                              <input
                                type="tel"
                                value={singleContact.phone}
                                onChange={(e) => setSingleContact((p) => ({ ...p, phone: e.target.value }))}
                                placeholder="Phone number"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddSingleContact()}
                                className="flex-1 bg-transparent px-3 py-2.5 text-sm focus:outline-none text-slate-800 dark:text-white placeholder-slate-400 min-w-0"
                              />
                            </div>
                          </div>
                          <div className="flex-1 w-full space-y-3">
                            <div>
                              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">Name (optional)</label>
                              <input type="text" value={singleContact.name}
                                onChange={(e) => setSingleContact((p) => ({ ...p, name: e.target.value }))}
                                placeholder="Contact name"
                                className="common-bg-icons w-full px-4 py-2.5 rounded-xl text-sm" />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">Call context (optional)</label>
                              <input
                                type="text"
                                value={singleContact.context}
                                onChange={(e) => setSingleContact((p) => ({ ...p, context: e.target.value }))}
                                placeholder="e.g. Follow-up, prior inquiry…"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddSingleContact()}
                                className="common-bg-icons w-full px-4 py-2.5 rounded-xl text-sm"
                              />
                            </div>
                          </div>
                          <button onClick={handleAddSingleContact} className="common-button-bg px-4 py-2.5 rounded-xl flex-shrink-0">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                            One number per line — optionally:{' '}
                            <code className="font-mono">+1234567890, Name, Call context</code>
                          </label>
                          <textarea value={bulkInput} onChange={(e) => setBulkInput(e.target.value)} rows={6}
                            placeholder={"+14155550123, John Doe, Follow-up on demo request\n+14155550124, Jane Smith\n+14155550125"}
                            className="common-bg-icons w-full px-4 py-3 rounded-xl text-sm font-mono resize-none" />
                          <button onClick={parseBulkContacts} className="mt-2 common-button-bg2 flex items-center gap-2 text-sm px-4 py-2 rounded-xl">
                            <Upload className="w-4 h-4" /> Parse & Preview
                          </button>
                        </div>
                      )}

                      {contactMode !== 'file' && (
                        campaignContacts.length > 0 ? (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                {campaignContacts.length} contact{campaignContacts.length !== 1 ? 's' : ''} added
                              </p>
                              <button onClick={() => setCampaignContacts([])} className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1">
                                <Trash2 className="w-3 h-3" /> Clear all
                              </button>
                            </div>
                            <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                              {campaignContacts.map((c) => (
                                <div key={c.id} className="flex items-center justify-between px-3 py-2 common-bg-icons rounded-lg">
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
                                  <button onClick={() => setCampaignContacts((p) => p.filter((x) => x.id !== c.id))}
                                    className="text-slate-400 hover:text-red-500 ml-2 flex-shrink-0">
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                            <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                            <p className="text-sm text-slate-400">No contacts added yet</p>
                          </div>
                        )
                      )}
                    </motion.div>
                  )}

                  {/* ── Step 3: Review & Launch ── */}
                  {campaignStep === 3 && (
                    <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-5">
                      {/* Start-now toggle */}
                      <div className="grid grid-cols-2 gap-3">
                        {([
                          { id: true,  label: 'Start Now',   desc: 'Begin dialing immediately after upload', icon: Play },
                          { id: false, label: 'Create Only', desc: 'Save the campaign — start it later',      icon: Clock },
                        ] as const).map((opt) => (
                          <button key={String(opt.id)} onClick={() => setStartNow(opt.id)}
                            className={`p-4 rounded-2xl border-2 text-left transition-all ${
                              startNow === opt.id
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                : 'border-slate-200 dark:border-slate-700 common-bg-icons'
                            }`}>
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${startNow === opt.id ? 'bg-indigo-500' : 'bg-slate-100 dark:bg-slate-700'}`}>
                              <opt.icon className={`w-4 h-4 ${startNow === opt.id ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                            </div>
                            <p className="font-semibold text-sm text-slate-800 dark:text-white">{opt.label}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{opt.desc}</p>
                          </button>
                        ))}
                      </div>

                      {/* Summary */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Campaign Summary</h4>
                        <div className="space-y-2 text-sm">
                          {[
                            { label: 'Name',           value: newCampaign.name },
                            { label: 'Agent',          value: agents.find((a) => a.id === newCampaign.agentId)?.name || '—' },
                            { label: 'Caller Number',  value: newCampaign.callerNumber || 'Not set' },
                            { label: 'Objective',      value: newCampaign.objective.trim() || '—' },
                            { label: 'Goal',           value: newCampaign.goal.trim() || '—' },
                            { label: 'Language',       value: newCampaign.language },
                            { label: 'Max Concurrent', value: `${newCampaign.maxConcurrent} simultaneous` },
                            { label: 'Contacts',       value: contactMode === 'file' ? (contactFile?.name || 'file') : `${campaignContacts.length}` },
                          ].map(({ label, value }) => (
                            <div key={label} className="flex justify-between">
                              <span className="text-slate-500 dark:text-slate-400">{label}</span>
                              <span className="font-medium text-slate-800 dark:text-white text-right ml-4 max-w-[200px] truncate">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Ordered-steps explainer */}
                      <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/40">
                        <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
                          On launch we <span className="font-semibold">create the campaign</span>, then{' '}
                          <span className="font-semibold">upload your contacts</span>
                          {startNow ? <> and <span className="font-semibold">start dialing</span> immediately.</> : <> and leave it ready to start when you are.</>}
                        </p>
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
                    disabled={isSavingCampaign || !step1Valid || !step2Valid}
                    className="common-button-bg px-6 py-2.5 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSavingCampaign ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> {wizardStage || 'Launching…'}</>
                    ) : startNow ? (
                      <><Play className="w-4 h-4" /> Launch Campaign</>
                    ) : (
                      <><Check className="w-4 h-4" /> Create Campaign</>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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

  return (
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
    </motion.div>
  );
};

export default CallSetup;
