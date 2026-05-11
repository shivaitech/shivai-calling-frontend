import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../../components/GlassCard';
import { useAgent } from '../../contexts/AgentContext';
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Plus,
  Trash2,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Calendar,
  Clock,
  Upload,
  Bot,
  Loader2,
  ChevronRight,
  Play,
  Pause,
  Square,
  Hash,
  Shield,
  Mic,
  MicOff,
  PhoneCall,
  PhoneMissed,
  BarChart2,
  Users,
  Zap,
  Info,
  X,
  Check,
  Link,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PhoneNumber {
  id: string;
  number: string;
  friendlyName: string;
  assignedAgentId: string | null;
  capabilities: { voice: boolean; sms: boolean };
  region: string;
}

interface InboundRule {
  numberId: string;
  recordCalls: boolean;
  maxConcurrent: number;
  businessHours: { enabled: boolean; start: string; end: string; timezone: string };
  fallback: 'voicemail' | 'transfer' | 'busy';
  fallbackNumber?: string;
}

interface OutboundCampaign {
  id: string;
  name: string;
  agentId: string;
  callerId: string;
  contacts: ContactEntry[];
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed';
  scheduledAt: string | null;
  timezone: string;
  maxConcurrent: number;
  retryAttempts: number;
  retryDelay: number;
  recordCalls: boolean;
  voicemailDetection: boolean;
  dncEnabled: boolean;
  createdAt: string;
  progress: { called: number; answered: number; failed: number };
}

interface ContactEntry {
  id: string;
  phone: string;
  name?: string;
}

// ─── Static Numbers ───────────────────────────────────────────────────────────

const STATIC_NUMBERS: PhoneNumber[] = [
  {
    id: 'num_1',
    number: '+1 (415) 555-0123',
    friendlyName: 'Main Support Line',
    assignedAgentId: null,
    capabilities: { voice: true, sms: true },
    region: 'US',
  },
  {
    id: 'num_2',
    number: '+1 (628) 555-0187',
    friendlyName: 'Sales Line',
    assignedAgentId: null,
    capabilities: { voice: true, sms: false },
    region: 'US',
  },
  {
    id: 'num_3',
    number: '+44 20 7946 0123',
    friendlyName: 'UK Office',
    assignedAgentId: null,
    capabilities: { voice: true, sms: true },
    region: 'GB',
  },
  {
    id: 'num_4',
    number: '+91 98765 43210',
    friendlyName: 'India Operations',
    assignedAgentId: null,
    capabilities: { voice: true, sms: true },
    region: 'IN',
  },
];

const TIMEZONES = [
  'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Asia/Tokyo',
  'Europe/London', 'Europe/Berlin', 'Europe/Paris',
  'America/New_York', 'America/Chicago', 'America/Los_Angeles',
  'Australia/Sydney', 'Pacific/Auckland',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const statusBadge = (status: OutboundCampaign['status']) => {
  const map: Record<OutboundCampaign['status'], { label: string; cls: string }> = {
    draft:     { label: 'Draft',     cls: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300' },
    scheduled: { label: 'Scheduled', cls: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
    running:   { label: 'Running',   cls: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
    paused:    { label: 'Paused',    cls: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' },
    completed: { label: 'Completed', cls: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' },
  };
  const s = map[status];
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

  const [activeSection, setActiveSection] = useState<'inbound' | 'outbound'>('inbound');

  // ── Inbound state ──
  const [numbers, setNumbers] = useState<PhoneNumber[]>(STATIC_NUMBERS);
  const [assignModal, setAssignModal] = useState<PhoneNumber | null>(null);
  const [rulesModal, setRulesModal] = useState<PhoneNumber | null>(null);
  const [inboundRules, setInboundRules] = useState<Record<string, InboundRule>>({});

  // ── Outbound state ──
  const [campaigns, setCampaigns] = useState<OutboundCampaign[]>([]);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [campaignStep, setCampaignStep] = useState<1 | 2 | 3>(1);
  const [bulkInput, setBulkInput] = useState('');
  const [contactMode, setContactMode] = useState<'single' | 'bulk'>('single');
  const [singleContact, setSingleContact] = useState({ phone: '', name: '' });
  const [campaignContacts, setCampaignContacts] = useState<ContactEntry[]>([]);
  const [campaignScheduleMode, setCampaignScheduleMode] = useState<'now' | 'schedule'>('now');
  const [isSavingCampaign, setIsSavingCampaign] = useState(false);
  const [newCampaign, setNewCampaign] = useState<Omit<OutboundCampaign, 'id' | 'createdAt' | 'progress' | 'contacts'>>({
    name: '',
    agentId: '',
    callerId: '',
    status: 'draft',
    scheduledAt: null,
    timezone: 'Asia/Kolkata',
    maxConcurrent: 2,
    retryAttempts: 2,
    retryDelay: 30,
    recordCalls: true,
    voicemailDetection: true,
    dncEnabled: false,
  });

  // ─── Inbound handlers ─────────────────────────────────────────────────────

  const handleAssignAgent = (agentId: string) => {
    if (!assignModal) return;
    setNumbers((prev) =>
      prev.map((n) => n.id === assignModal.id ? { ...n, assignedAgentId: agentId || null } : n)
    );
    setAssignModal(null);
  };

  const handleSaveRules = (rule: InboundRule) => {
    setInboundRules((prev) => ({ ...prev, [rule.numberId]: rule }));
    setRulesModal(null);
  };

  // ─── Outbound handlers ────────────────────────────────────────────────────

  const handleAddSingleContact = () => {
    if (!singleContact.phone.trim()) return;
    setCampaignContacts((prev) => [
      ...prev,
      { id: `c_${Date.now()}`, phone: singleContact.phone.trim(), name: singleContact.name.trim() },
    ]);
    setSingleContact({ phone: '', name: '' });
  };

  const parseBulkContacts = () => {
    const lines = bulkInput.split('\n').map((l) => l.trim()).filter(Boolean);
    const parsed: ContactEntry[] = lines.map((line, i) => {
      const [phone, ...nameParts] = line.split(',').map((p) => p.trim());
      return { id: `c_${Date.now()}_${i}`, phone, name: nameParts.join(' ') };
    });
    setCampaignContacts(parsed);
  };

  const handleSaveCampaign = async () => {
    if (!newCampaign.name.trim() || !newCampaign.agentId || campaignContacts.length === 0) return;
    setIsSavingCampaign(true);
    await new Promise((r) => setTimeout(r, 900));
    const campaign: OutboundCampaign = {
      ...newCampaign,
      id: `camp_${Date.now()}`,
      status: campaignScheduleMode === 'now' ? 'running' : 'scheduled',
      scheduledAt: campaignScheduleMode === 'schedule' ? newCampaign.scheduledAt : null,
      contacts: campaignContacts,
      createdAt: new Date().toISOString(),
      progress: { called: 0, answered: 0, failed: 0 },
    };
    setCampaigns((prev) => [campaign, ...prev]);
    setIsSavingCampaign(false);
    setShowCreateCampaign(false);
    resetCampaignForm();
  };

  const resetCampaignForm = () => {
    setCampaignStep(1);
    setCampaignContacts([]);
    setBulkInput('');
    setContactMode('single');
    setSingleContact({ phone: '', name: '' });
    setCampaignScheduleMode('now');
    setNewCampaign({
      name: '', agentId: '', callerId: '', status: 'draft', scheduledAt: null,
      timezone: 'Asia/Kolkata', maxConcurrent: 2, retryAttempts: 2, retryDelay: 30,
      recordCalls: true, voicemailDetection: true, dncEnabled: false,
    });
  };

  const handleCampaignAction = (id: string, action: 'pause' | 'resume' | 'stop') => {
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: action === 'pause' ? 'paused' : action === 'resume' ? 'running' : 'completed' }
          : c
      )
    );
  };

  // ─── Derived ─────────────────────────────────────────────────────────────

  const voiceNumbers = numbers.filter((n) => n.capabilities.voice);
  const assignedCount = numbers.filter((n) => n.assignedAgentId).length;
  const step1Valid = !!(newCampaign.name.trim() && newCampaign.agentId);
  const step2Valid = campaignContacts.length > 0;

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
                  <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 rounded-xl whitespace-nowrap">
                    <Info className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Static numbers — connect Twilio to sync live</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {numbers.map((num) => {
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
                              {num.capabilities.voice && (
                                <span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-md">Voice</span>
                              )}
                              {num.capabilities.sms && (
                                <span className="text-xs bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded-md">SMS</span>
                              )}
                              <span className="text-xs text-slate-400 dark:text-slate-500">{num.region}</span>
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
                { label: 'Total Campaigns', value: campaigns.length,                                                         icon: Zap,      color: 'from-blue-500 to-indigo-600'   },
                { label: 'Running',         value: campaigns.filter((c) => c.status === 'running').length,                   icon: Play,     color: 'from-green-500 to-emerald-600'  },
                { label: 'Contacts Called', value: campaigns.reduce((s, c) => s + c.progress.called, 0),                    icon: PhoneCall, color: 'from-purple-500 to-pink-600'   },
                {
                  label: 'Answer Rate',
                  value: (() => {
                    const called   = campaigns.reduce((s, c) => s + c.progress.called, 0);
                    const answered = campaigns.reduce((s, c) => s + c.progress.answered, 0);
                    return called > 0 ? `${Math.round((answered / called) * 100)}%` : '—';
                  })(),
                  icon: BarChart2,
                  color: 'from-orange-500 to-amber-600',
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
                  <button
                    onClick={() => setShowCreateCampaign(true)}
                    className="common-button-bg flex items-center gap-2 flex-shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    New Campaign
                  </button>
                </div>

                {campaigns.length === 0 ? (
                  <div className="text-center py-14 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 flex items-center justify-center mx-auto mb-4">
                      <PhoneOutgoing className="w-7 h-7 text-indigo-500" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-2">No campaigns yet</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
                      Create a campaign to start making AI-powered outbound calls to your contacts.
                    </p>
                    <button onClick={() => setShowCreateCampaign(true)} className="common-button-bg inline-flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Create Campaign
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {campaigns.map((campaign) => {
                      const agent = agents.find((a) => a.id === campaign.agentId);
                      const total = campaign.contacts.length;
                      const pct = total > 0 ? Math.round((campaign.progress.called / total) * 100) : 0;
                      return (
                        <div key={campaign.id} className="common-bg-icons p-4 sm:p-5 rounded-2xl">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                <PhoneOutgoing className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-semibold text-slate-800 dark:text-white text-sm">{campaign.name}</h4>
                                  {statusBadge(campaign.status)}
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                                  {agent && <span className="flex items-center gap-1"><Bot className="w-3 h-3" />{agent.name}</span>}
                                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{total} contacts</span>
                                  {campaign.callerId && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{campaign.callerId}</span>}
                                  {campaign.scheduledAt && (
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />{new Date(campaign.scheduledAt).toLocaleString()}
                                    </span>
                                  )}
                                </div>

                                {(campaign.status === 'running' || campaign.status === 'paused' || campaign.status === 'completed') && (
                                  <div className="mt-3">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs text-slate-500 dark:text-slate-400">{campaign.progress.called} / {total} called</span>
                                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{pct}%</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                      <motion.div
                                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pct}%` }}
                                        transition={{ duration: 0.6, ease: 'easeOut' }}
                                      />
                                    </div>
                                    <div className="flex gap-4 mt-1.5 text-xs">
                                      <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" />{campaign.progress.answered} answered
                                      </span>
                                      <span className="text-red-500 flex items-center gap-1">
                                        <PhoneMissed className="w-3 h-3" />{campaign.progress.failed} failed
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0">
                              {campaign.status === 'running' && (
                                <button onClick={() => handleCampaignAction(campaign.id, 'pause')} title="Pause"
                                  className="p-2 rounded-lg text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors">
                                  <Pause className="w-4 h-4" />
                                </button>
                              )}
                              {campaign.status === 'paused' && (
                                <button onClick={() => handleCampaignAction(campaign.id, 'resume')} title="Resume"
                                  className="p-2 rounded-lg text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                                  <Play className="w-4 h-4" />
                                </button>
                              )}
                              {(campaign.status === 'running' || campaign.status === 'paused') && (
                                <button onClick={() => handleCampaignAction(campaign.id, 'stop')} title="Stop"
                                  className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                  <Square className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => setCampaigns((prev) => prev.filter((c) => c.id !== campaign.id))}
                                title="Delete"
                                className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
                  {/* Unassign option */}
                  <button
                    onClick={() => handleAssignAgent('')}
                    className="w-full flex items-center gap-3 p-3 rounded-xl common-bg-icons hover:bg-red-50 dark:hover:bg-red-900/20 text-left transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                      <XCircle className="w-4 h-4 text-slate-400 group-hover:text-red-500" />
                    </div>
                    <span className="text-sm text-slate-500 dark:text-slate-400 group-hover:text-red-600 dark:group-hover:text-red-400">
                      Remove assignment
                    </span>
                  </button>

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
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
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
                            AI Agent <span className="text-red-500">*</span>
                          </label>
                          {agentsLoading ? (
                            <div className="common-bg-icons w-full px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 text-slate-400">
                              <Loader2 className="w-4 h-4 animate-spin" /> Loading agents…
                            </div>
                          ) : (
                            <select value={newCampaign.agentId}
                              onChange={(e) => setNewCampaign((p) => ({ ...p, agentId: e.target.value }))}
                              className="common-bg-icons w-full px-4 py-2.5 rounded-xl text-sm">
                              <option value="">Select agent…</option>
                              {agents.map((a) => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                              ))}
                            </select>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            Caller ID (From Number)
                          </label>
                          <select value={newCampaign.callerId}
                            onChange={(e) => setNewCampaign((p) => ({ ...p, callerId: e.target.value }))}
                            className="common-bg-icons w-full px-4 py-2.5 rounded-xl text-sm">
                            <option value="">Select number…</option>
                            {voiceNumbers.map((n) => (
                              <option key={n.id} value={n.number}>{n.number} — {n.friendlyName}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Call Settings</h4>
                        <div className="grid grid-cols-3 gap-4">
                          {[
                            { key: 'maxConcurrent', label: 'Max Concurrent', min: 1, max: 20 },
                            { key: 'retryAttempts',  label: 'Retry Attempts', min: 0, max: 5 },
                            { key: 'retryDelay',     label: 'Retry Delay (min)', min: 5, max: 1440 },
                          ].map(({ key, label, min, max }) => (
                            <div key={key}>
                              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">{label}</label>
                              <input type="number" min={min} max={max}
                                value={newCampaign[key as keyof typeof newCampaign] as number}
                                onChange={(e) => setNewCampaign((p) => ({ ...p, [key]: +e.target.value }))}
                                className="common-bg-icons w-full px-4 py-2.5 rounded-xl text-sm" />
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                          {[
                            { key: 'recordCalls',        label: 'Record Calls',         icon: Mic },
                            { key: 'voicemailDetection', label: 'Voicemail Detection',  icon: PhoneCall },
                            { key: 'dncEnabled',         label: 'DNC List Check',       icon: Shield },
                          ].map(({ key, label, icon: Icon }) => (
                            <label key={key} className="flex items-center gap-2.5 p-3 common-bg-icons rounded-xl cursor-pointer">
                              <input type="checkbox"
                                checked={newCampaign[key as keyof typeof newCampaign] as boolean}
                                onChange={(e) => setNewCampaign((p) => ({ ...p, [key]: e.target.checked }))}
                                className="w-4 h-4 accent-indigo-600" />
                              <Icon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* ── Step 2: Contacts ── */}
                  {campaignStep === 2 && (
                    <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-4">
                      <div className="flex gap-1 common-bg-icons rounded-xl p-1 w-fit">
                        {(['single', 'bulk'] as const).map((m) => (
                          <button key={m} onClick={() => setContactMode(m)}
                            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${contactMode === m ? 'common-button-bg2 shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}>
                            {m === 'single' ? 'Single Number' : 'Bulk Import'}
                          </button>
                        ))}
                      </div>

                      {contactMode === 'single' ? (
                        <div className="flex gap-3 items-end">
                          <div className="flex-1">
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">Phone Number</label>
                            <input type="tel" value={singleContact.phone}
                              onChange={(e) => setSingleContact((p) => ({ ...p, phone: e.target.value }))}
                              placeholder="+1 (555) 000-0000"
                              onKeyDown={(e) => e.key === 'Enter' && handleAddSingleContact()}
                              className="common-bg-icons w-full px-4 py-2.5 rounded-xl text-sm" />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">Name (optional)</label>
                            <input type="text" value={singleContact.name}
                              onChange={(e) => setSingleContact((p) => ({ ...p, name: e.target.value }))}
                              placeholder="Contact name"
                              className="common-bg-icons w-full px-4 py-2.5 rounded-xl text-sm" />
                          </div>
                          <button onClick={handleAddSingleContact} className="common-button-bg px-4 py-2.5 rounded-xl flex-shrink-0">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                            One number per line — optionally: <code className="font-mono">+1234567890, Name</code>
                          </label>
                          <textarea value={bulkInput} onChange={(e) => setBulkInput(e.target.value)} rows={6}
                            placeholder={"+14155550123, John Doe\n+14155550124, Jane Smith\n+14155550125"}
                            className="common-bg-icons w-full px-4 py-3 rounded-xl text-sm font-mono resize-none" />
                          <button onClick={parseBulkContacts} className="mt-2 common-button-bg2 flex items-center gap-2 text-sm px-4 py-2 rounded-xl">
                            <Upload className="w-4 h-4" /> Parse & Preview
                          </button>
                        </div>
                      )}

                      {campaignContacts.length > 0 ? (
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
                                <div className="flex items-center gap-2">
                                  <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                  <span className="text-sm text-slate-700 dark:text-slate-300 font-mono">{c.phone}</span>
                                  {c.name && <span className="text-xs text-slate-500">— {c.name}</span>}
                                </div>
                                <button onClick={() => setCampaignContacts((p) => p.filter((x) => x.id !== c.id))}
                                  className="text-slate-400 hover:text-red-500 ml-2">
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
                      )}
                    </motion.div>
                  )}

                  {/* ── Step 3: Schedule ── */}
                  {campaignStep === 3 && (
                    <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-5">
                      <div className="grid grid-cols-2 gap-3">
                        {([
                          { id: 'now',      label: 'Call Now',  desc: 'Start immediately after saving',    icon: Play     },
                          { id: 'schedule', label: 'Schedule',  desc: 'Set a specific date and time',      icon: Calendar },
                        ] as const).map((opt) => (
                          <button key={opt.id} onClick={() => setCampaignScheduleMode(opt.id)}
                            className={`p-4 rounded-2xl border-2 text-left transition-all ${
                              campaignScheduleMode === opt.id
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                : 'border-slate-200 dark:border-slate-700 common-bg-icons'
                            }`}>
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${campaignScheduleMode === opt.id ? 'bg-indigo-500' : 'bg-slate-100 dark:bg-slate-700'}`}>
                              <opt.icon className={`w-4 h-4 ${campaignScheduleMode === opt.id ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                            </div>
                            <p className="font-semibold text-sm text-slate-800 dark:text-white">{opt.label}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{opt.desc}</p>
                          </button>
                        ))}
                      </div>

                      {campaignScheduleMode === 'schedule' && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                              Date & Time <span className="text-red-500">*</span>
                            </label>
                            <input type="datetime-local" value={newCampaign.scheduledAt || ''}
                              onChange={(e) => setNewCampaign((p) => ({ ...p, scheduledAt: e.target.value }))}
                              min={new Date().toISOString().slice(0, 16)}
                              className="common-bg-icons w-full px-4 py-2.5 rounded-xl text-sm" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Timezone</label>
                            <select value={newCampaign.timezone}
                              onChange={(e) => setNewCampaign((p) => ({ ...p, timezone: e.target.value }))}
                              className="common-bg-icons w-full px-4 py-2.5 rounded-xl text-sm">
                              {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                            </select>
                          </div>
                        </motion.div>
                      )}

                      {/* Summary */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Campaign Summary</h4>
                        <div className="space-y-2 text-sm">
                          {[
                            { label: 'Name',       value: newCampaign.name },
                            { label: 'Agent',      value: agents.find((a) => a.id === newCampaign.agentId)?.name || '—' },
                            { label: 'Contacts',   value: `${campaignContacts.length}` },
                            { label: 'Caller ID',  value: newCampaign.callerId || 'Not set' },
                            { label: 'Concurrent', value: `${newCampaign.maxConcurrent} simultaneous` },
                            { label: 'Retries',    value: `${newCampaign.retryAttempts}× / ${newCampaign.retryDelay} min delay` },
                          ].map(({ label, value }) => (
                            <div key={label} className="flex justify-between">
                              <span className="text-slate-500 dark:text-slate-400">{label}</span>
                              <span className="font-medium text-slate-800 dark:text-white text-right ml-4 max-w-[180px] truncate">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
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
                    onClick={handleSaveCampaign}
                    disabled={isSavingCampaign || (campaignScheduleMode === 'schedule' && !newCampaign.scheduledAt)}
                    className="common-button-bg px-6 py-2.5 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSavingCampaign ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Launching…</>
                    ) : campaignScheduleMode === 'now' ? (
                      <><Play className="w-4 h-4" /> Launch Campaign</>
                    ) : (
                      <><Calendar className="w-4 h-4" /> Schedule Campaign</>
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
