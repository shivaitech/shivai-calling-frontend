import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import GlassCard from '../../components/GlassCard';
import Pagination from '../../components/Pagination';
import appToast from '../../components/AppToast';
import { useAgent } from '../../contexts/AgentContext';
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

type ContactTab = 'completed' | 'pending' | 'all';

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

  const [tab, setTab] = useState<ContactTab>('completed');
  const [contacts, setContacts] = useState<CampaignContact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalContacts, setTotalContacts] = useState(0);
  const pageSize = 20;

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
        tab === 'completed' ? 'completed' : tab === 'pending' ? 'pending' : undefined;
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
    { label: 'Total', value: stats?.total ?? 0, icon: Users, tone: 'text-slate-600 dark:text-slate-300' },
    { label: 'Completed', value: stats?.completed ?? 0, icon: CheckCircle, tone: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Pending', value: stats?.pending ?? 0, icon: Clock, tone: 'text-amber-600 dark:text-amber-400' },
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
                  { id: 'completed' as const, label: 'Completed' },
                  { id: 'pending' as const, label: 'Upcoming' },
                  { id: 'all' as const, label: 'All' },
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

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[99999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white">Delete campaign?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              This permanently removes <span className="font-medium text-slate-700 dark:text-slate-200">{campaign.name}</span> and its contacts. This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
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
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignDetail;
