import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../../components/GlassCard';
import Pagination from '../../components/Pagination';
import appToast from '../../components/AppToast';
import { useAgent } from '../../contexts/AgentContext';
import SessionTranscriptModal from '../Employees/agents/SessionTranscriptModal';
import { agentAPI } from '../../services/agentAPI';
import {
  getCampaign,
  getCampaignStatusDetail,
  getCampaignContacts,
  startCampaign,
  pauseCampaign,
  resumeCampaign,
  stopCampaign,
  deleteCampaign,
  type Campaign,
  type CampaignLiveStatus,
  type CampaignContact,
} from '../../services/phoneNumbersAPI';
import {
  ArrowLeft,
  Bot,
  CheckCircle,
  Clock,
  Eye,
  Loader2,
  Pause,
  Phone,
  PhoneCall,
  PhoneMissed,
  PhoneOutgoing,
  Play,
  Square,
  Trash2,
  Users,
  AlertCircle,
  X,
} from 'lucide-react';

type ContactTab = 'completed' | 'pending' | 'no_answer' | 'all';

const statusBadge = (status: string) => {
  const map: Record<string, { label: string; cls: string }> = {
    draft: { label: 'Draft', cls: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300' },
    running: { label: 'Running', cls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' },
    paused: { label: 'Paused', cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' },
    completed: { label: 'Completed', cls: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' },
    stopped: { label: 'Stopped', cls: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300' },
  };
  const s = map[status] || { label: status || 'Unknown', cls: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
};

const contactStatusBadge = (status: string) => {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: 'Upcoming', cls: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300' },
    dialing: { label: 'Dialing', cls: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
    completed: { label: 'Completed', cls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' },
    answered: { label: 'Answered', cls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' },
    no_answer: { label: 'No answer', cls: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300' },
    failed: { label: 'Failed', cls: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300' },
    voicemail: { label: 'Voicemail', cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' },
  };
  const s = map[status] || { label: status || 'Unknown', cls: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
};

const formatWhen = (timestamp?: string) => {
  if (!timestamp) return '—';
  const d = new Date(timestamp);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/** Prefer explicit session/call ids from the contact payload. */
const contactSessionId = (c: CampaignContact): string | null => {
  const id =
    c.session_id ||
    c.agent_session_id ||
    c.call_id ||
    c.room_name ||
    c.room_id ||
    c.custom_fields?.session_id ||
    c.custom_fields?.call_id ||
    c.custom_fields?.room_name;
  return id ? String(id) : null;
};

/** Outbound sessions are named like `outbound-{contactId}` — match on contact _id. */
const sessionMatchesContact = (session: any, contactId: string) => {
  if (!contactId) return false;
  const sid = String(session?.session_id || session?.id || session?.call_id || '');
  if (!sid) return false;
  return (
    sid === contactId ||
    sid === `outbound-${contactId}` ||
    sid.includes(contactId)
  );
};

const canViewCallDetails = (c: CampaignContact) => {
  if (contactSessionId(c)) return true;
  // Dialed contacts may link to an agent session via outbound-{contactId}
  return !['pending', 'upcoming'].includes(String(c.status || '').toLowerCase());
};

const CampaignDetail: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const { agents } = useAgent();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [live, setLive] = useState<CampaignLiveStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [tab, setTab] = useState<ContactTab>('all');
  const [contacts, setContacts] = useState<CampaignContact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalContacts, setTotalContacts] = useState(0);
  const pageSize = 20;
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [openingContactId, setOpeningContactId] = useState<string | null>(null);

  const agent = campaign ? agents.find((a) => a.id === campaign.agent_id) : undefined;
  const stats = live || campaign?.stats || null;
  const totalPages = Math.max(1, Math.ceil(totalContacts / pageSize));

  const loadCampaign = useCallback(async () => {
    if (!campaignId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getCampaign(campaignId);
      setCampaign(data);
      try {
        const detail = await getCampaignStatusDetail(campaignId);
        setLive(detail.stats);
        setCampaign((c) =>
          c
            ? {
                ...c,
                status: detail.status || c.status,
                name: detail.name || c.name,
                started_at: detail.started_at ?? c.started_at,
                completed_at: detail.completed_at ?? c.completed_at,
                stats: detail.stats,
              }
            : c
        );
      } catch {
        setLive(data.stats || null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load campaign');
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  const loadContacts = useCallback(async () => {
    if (!campaignId) return;
    setContactsLoading(true);
    setContactsError(null);
    try {
      const statusParam =
        tab === 'completed'
          ? 'completed'
          : tab === 'pending'
            ? 'pending'
            : tab === 'no_answer'
              ? 'no_answer'
              : undefined;
      const result = await getCampaignContacts(campaignId, {
        status: statusParam,
        page,
        limit: pageSize,
      });
      setContacts(Array.isArray(result.data) ? result.data : []);
      setTotalContacts(result.total || 0);
    } catch (err: any) {
      setContactsError(err.message || 'Failed to load contacts');
      setContacts([]);
      setTotalContacts(0);
    } finally {
      setContactsLoading(false);
    }
  }, [campaignId, tab, page]);

  useEffect(() => {
    loadCampaign();
  }, [loadCampaign]);

  useEffect(() => {
    setPage(1);
  }, [tab]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  // Poll live stats while running
  useEffect(() => {
    if (!campaignId || campaign?.status !== 'running') return;
    const t = setInterval(async () => {
      try {
        const detail = await getCampaignStatusDetail(campaignId);
        setLive(detail.stats);
        setCampaign((c) => (c ? { ...c, status: detail.status || c.status, stats: detail.stats } : c));
      } catch {
        /* ignore poll errors */
      }
    }, 5000);
    return () => clearInterval(t);
  }, [campaignId, campaign?.status]);

  const openCallDetails = async (contact: CampaignContact) => {
    if (!campaign?.agent_id) {
      appToast.error('Campaign agent is missing');
      return;
    }

    setOpeningContactId(contact._id);
    try {
      let matched: any = null;

      // Prefer an explicit session id on the contact when present
      const explicitId = contactSessionId(contact);
      if (explicitId) {
        matched = { session_id: explicitId, id: explicitId, call_id: contact.call_id || explicitId };
      } else {
        // Load agent sessions (no search query) and match where session id contains contact _id
        // e.g. Analytics session ids look like `outbound-{contactId}`
        const response = await agentAPI.getAgentSessions(
          'page=1&limit=100',
          campaign.agent_id
        );
        const sessions: any[] = response?.sessions || [];
        matched = sessions.find((s) => sessionMatchesContact(s, contact._id)) || null;

        if (!matched) {
          // Fall back to the conventional outbound session id pattern
          const constructed = `outbound-${contact._id}`;
          matched = { session_id: constructed, id: constructed, call_id: constructed };
        }
      }

      const sessionId = String(matched.session_id || matched.id || matched.call_id || '');
      if (!sessionId || (!explicitId && !sessionMatchesContact({ session_id: sessionId }, contact._id))) {
        throw new Error('No matching call session for this contact');
      }

      setSelectedSession({
        ...matched,
        session_id: sessionId,
        id: sessionId,
        call_id: matched.call_id || sessionId,
        agent_id: campaign.agent_id,
        agent: agent ? { id: agent.id, name: agent.name } : { id: campaign.agent_id },
        phone_number: matched?.direction?.number || contact.phone_number,
        direction: matched?.direction || {
          type: 'outbound',
          number: contact.phone_number,
        },
        name: contact.name,
        created_at:
          matched.created_at ||
          contact.completed_at ||
          contact.called_at ||
          contact.updated_at ||
          contact.created_at,
      });
    } catch (err: any) {
      appToast.error(err.message || 'Failed to open call details');
    } finally {
      setOpeningContactId(null);
    }
  };

  const runAction = async (action: 'start' | 'pause' | 'resume' | 'stop' | 'delete') => {
    if (!campaignId || !campaign) return;
    setActionBusy(true);
    try {
      if (action === 'pause') {
        await pauseCampaign(campaignId);
        setCampaign((c) => (c ? { ...c, status: 'paused' } : c));
        appToast.success('Campaign paused');
      } else if (action === 'resume') {
        await resumeCampaign(campaignId);
        setCampaign((c) => (c ? { ...c, status: 'running' } : c));
        appToast.success('Campaign resumed');
      } else if (action === 'start') {
        await startCampaign(campaignId);
        setCampaign((c) => (c ? { ...c, status: 'running' } : c));
        appToast.success('Campaign started');
      } else if (action === 'stop') {
        await stopCampaign(campaignId);
        setCampaign((c) => (c ? { ...c, status: 'stopped' } : c));
        appToast.success('Campaign stopped');
      } else if (action === 'delete') {
        await deleteCampaign(campaignId);
        appToast.success('Campaign deleted');
        navigate('/workflows#callsetup', { state: { callSetupSection: 'outbound' } });
        return;
      }
      try {
        const detail = await getCampaignStatusDetail(campaignId);
        setLive(detail.stats);
        setCampaign((c) => (c ? { ...c, status: detail.status || c.status, stats: detail.stats } : c));
      } catch {
        /* ignore */
      }
    } catch (err: any) {
      appToast.error(err.message || `Failed to ${action} campaign`);
    } finally {
      setActionBusy(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-2 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading campaign…</span>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <p className="text-slate-700 dark:text-slate-300">{error || 'Campaign not found'}</p>
        <button
          onClick={() => navigate('/workflows#callsetup', { state: { callSetupSection: 'outbound' } })}
          className="common-button-bg2 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to campaigns
        </button>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Calls', value: stats?.total ?? 0, icon: Users, tone: 'text-slate-600 dark:text-slate-300' },
    { label: 'Completed Calls', value: stats?.completed ?? 0, icon: CheckCircle, tone: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Pending Calls', value: stats?.pending ?? 0, icon: Clock, tone: 'text-amber-600 dark:text-amber-400' },
    { label: 'Dialing', value: stats?.dialing ?? 0, icon: PhoneCall, tone: 'text-blue-600 dark:text-blue-400' },
    { label: 'No answer', value: stats?.no_answer ?? 0, icon: PhoneMissed, tone: 'text-rose-600 dark:text-rose-400' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3 min-w-0">
          <button
            onClick={() => navigate('/workflows#callsetup', { state: { callSetupSection: 'outbound' } })}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Campaigns
          </button>
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 shadow-md">
              <PhoneOutgoing className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate">
                  {campaign.name}
                </h1>
                {statusBadge(campaign.status)}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                {agent && (
                  <span className="flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5" />
                    {agent.name}
                  </span>
                )}
                <span className="flex items-center gap-1.5 font-mono">
                  <Phone className="w-3.5 h-3.5" />
                  {campaign.caller_number}
                </span>
                <span className="uppercase tracking-wide text-xs self-center">{campaign.language}</span>
              </div>
              {(campaign.objective || campaign.goal) && (
                <div className="mt-3 space-y-1.5 text-sm">
                  {campaign.objective && (
                    <p className="text-slate-600 dark:text-slate-300">
                      <span className="font-medium text-slate-800 dark:text-slate-200">Objective:</span>{' '}
                      {campaign.objective}
                    </p>
                  )}
                  {campaign.goal && (
                    <p className="text-slate-600 dark:text-slate-300">
                      <span className="font-medium text-slate-800 dark:text-slate-200">Goal:</span>{' '}
                      {campaign.goal}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
          {campaign.status === 'running' && (
            <button
              onClick={() => runAction('pause')}
              disabled={actionBusy}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 disabled:opacity-50"
            >
              {actionBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pause className="w-4 h-4" />}
              Pause
            </button>
          )}
          {campaign.status === 'paused' && (
            <button
              onClick={() => runAction('resume')}
              disabled={actionBusy}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 disabled:opacity-50"
            >
              {actionBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Resume
            </button>
          )}
          {campaign.status === 'draft' && (
            <button
              onClick={() => runAction('start')}
              disabled={actionBusy}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 disabled:opacity-50"
            >
              {actionBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Start
            </button>
          )}
          {(campaign.status === 'running' || campaign.status === 'paused') && (
            <button
              onClick={() => runAction('stop')}
              disabled={actionBusy}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
            >
              <Square className="w-4 h-4" />
              Stop
            </button>
          )}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={actionBusy}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {statCards.map((s) => (
          <GlassCard key={s.label}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{s.label}</span>
                <s.icon className={`w-4 h-4 ${s.tone}`} />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{s.value}</p>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Contact lists — analytics-style */}
      <GlassCard>
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Call activity</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Completed dials and upcoming numbers for this campaign
              </p>
            </div>
            <div className="flex gap-1 common-bg-icons rounded-xl p-1 w-fit">
              {(
                [
                  { id: 'all' as const, label: 'All' },
                  { id: 'pending' as const, label: 'Upcoming' },
                  { id: 'completed' as const, label: 'Completed' },
                  { id: 'no_answer' as const, label: 'Not answered' },
                ]
              ).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    tab === t.id ? 'common-button-bg2 shadow-sm' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {contactsError && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-rose-600 dark:text-rose-400 flex-1">{contactsError}</p>
              <button onClick={() => setContactsError(null)} className="text-rose-400 hover:text-rose-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {contactsLoading ? (
            <div className="flex items-center justify-center py-14 gap-2 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading contacts…</span>
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-14 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
              <Phone className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {tab === 'completed'
                  ? 'No completed calls yet'
                  : tab === 'pending'
                    ? 'No upcoming numbers'
                    : tab === 'no_answer'
                      ? 'No unanswered calls'
                      : 'No contacts in this campaign'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Contacts appear here from the numbers you added when creating the campaign.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {contacts.map((c, i) => {
                const context =
                  c.custom_fields?.call_context ||
                  c.custom_fields?.context ||
                  c.custom_fields?.reason;
                return (
                  <motion.div
                    key={c._id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.2) }}
                    className="group p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center flex-shrink-0">
                          <Phone className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-mono font-semibold text-slate-800 dark:text-white">
                              {c.phone_number}
                            </span>
                            {contactStatusBadge(c.status)}
                          </div>
                          {c.name && (
                            <p className="text-sm text-slate-600 dark:text-slate-300">{c.name}</p>
                          )}
                          {context && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                              {context}
                            </p>
                          )}
                          <p className="text-xs text-slate-400">{formatWhen(c.created_at)}</p>
                        </div>
                      </div>

                      {canViewCallDetails(c) && (
                        <button
                          type="button"
                          onClick={() => openCallDetails(c)}
                          disabled={openingContactId === c._id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-all duration-200 text-xs font-medium flex-shrink-0 disabled:opacity-50"
                        >
                          {openingContactId === c._id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                          <span className="hidden sm:inline">View call details</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalContacts}
                itemsPerPage={pageSize}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      </GlassCard>

      {/* Same session / call-summary modal as Analytics */}
      {selectedSession && (
        <SessionTranscriptModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}

      {/* Delete confirm */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowDeleteConfirm(false)}
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
                <span className="font-medium text-slate-700 dark:text-slate-200">{campaign.name}</span> and its
                contacts. This cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={actionBusy}
                  className="px-4 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => runAction('delete')}
                  disabled={actionBusy}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {actionBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CampaignDetail;
