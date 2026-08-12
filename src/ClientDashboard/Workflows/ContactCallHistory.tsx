import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  CheckCircle,
  Clock,
  Eye,
  History,
  Loader2,
  Phone,
  PhoneIncoming,
  PhoneMissed,
  PhoneOutgoing,
  User,
} from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import appToast from '../../components/AppToast';
import Pagination from '../../components/Pagination';
import SessionTranscriptModal from '../Employees/agents/SessionTranscriptModal';
import { useAgent } from '../../contexts/AgentContext';
import { agentAPI } from '../../services/agentAPI';
import {
  getContact,
  getCallHistoryByNumber,
  getCallHistoryItem,
  getCallHistoryStats,
  listCallHistory,
  type CallHistoryItem,
  type TenantContact,
} from '../../services/contactsAPI';

const PAGE_SIZE = 20;

const formatDuration = (seconds?: number) => {
  const s = Math.max(0, Number(seconds) || 0);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m < 60) return rem ? `${m}m ${rem}s` : `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
};

const formatWhen = (iso?: string) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

const statusTone = (status?: string) => {
  const s = String(status || '').toLowerCase();
  if (s.includes('complete') || s === 'answered' || s === 'done') {
    return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300';
  }
  if (s.includes('fail') || s.includes('error')) {
    return 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300';
  }
  if (s.includes('no_answer') || s.includes('no-answer') || s.includes('miss')) {
    return 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300';
  }
  if (s.includes('dial') || s.includes('ring') || s.includes('progress')) {
    return 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300';
  }
  return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300';
};

const ContactCallHistory: React.FC = () => {
  const { contactId = '' } = useParams<{ contactId: string }>();
  const navigate = useNavigate();
  const { agents } = useAgent();

  const [contact, setContact] = useState<TenantContact | null>(null);
  const [contactLoading, setContactLoading] = useState(true);
  const [contactError, setContactError] = useState<string | null>(null);

  const [calls, setCalls] = useState<CallHistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [callsLoading, setCallsLoading] = useState(true);
  const [callsError, setCallsError] = useState<string | null>(null);
  const [direction, setDirection] = useState<'all' | 'inbound' | 'outbound'>('all');

  const [stats, setStats] = useState<any>(null);
  const [openingCallId, setOpeningCallId] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);

  const loadContact = useCallback(async () => {
    if (!contactId) return;
    setContactLoading(true);
    setContactError(null);
    try {
      const c = await getContact(contactId);
      setContact(c);
    } catch (err: any) {
      setContact(null);
      setContactError(err.message || 'Failed to load contact');
    } finally {
      setContactLoading(false);
    }
  }, [contactId]);

  const loadCalls = useCallback(async () => {
    if (!contact?.phone_number && !contactId) return;
    setCallsLoading(true);
    setCallsError(null);
    try {
      let result;
      if (contact?.phone_number) {
        result = await getCallHistoryByNumber({
          page,
          limit: PAGE_SIZE,
          direction,
          phone_number: contact.phone_number,
          contact_id: contactId || undefined,
        });
      } else {
        result = await listCallHistory({
          page,
          limit: PAGE_SIZE,
          direction,
          contact_id: contactId || undefined,
        });
      }

      setCalls(result.calls || []);
      setTotal(result.pagination?.total || result.calls?.length || 0);
      setTotalPages(Math.max(1, result.pagination?.total_pages || 1));
    } catch (err: any) {
      setCalls([]);
      setCallsError(err.message || 'Failed to load call history');
    } finally {
      setCallsLoading(false);
    }
  }, [contactId, contact?.phone_number, page, direction]);

  const loadStats = useCallback(async () => {
    if (!contactId && !contact?.phone_number) return;
    try {
      const data = await getCallHistoryStats({
        direction,
        contact_id: contactId || undefined,
        phone_number: contact?.phone_number || undefined,
      });
      setStats(data);
    } catch {
      setStats(null);
    }
  }, [contactId, contact?.phone_number, direction]);

  useEffect(() => {
    loadContact();
  }, [loadContact]);

  useEffect(() => {
    if (contactLoading) return;
    loadCalls();
  }, [contactLoading, loadCalls]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    setPage(1);
  }, [direction, contactId]);

  const localAnalytics = useMemo(() => {
    const list = calls;
    const completed = list.filter((c) =>
      /complete|answered|done/i.test(String(c.status || ''))
    ).length;
    const noAnswer = list.filter((c) =>
      /no[_-]?answer|miss/i.test(String(c.status || ''))
    ).length;
    const failed = list.filter((c) => /fail|error/i.test(String(c.status || ''))).length;
    const durations = list
      .map((c) => Number(c.duration_seconds) || 0)
      .filter((n) => n > 0);
    const avgDuration =
      durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0;
    return {
      total: total || list.length,
      completed,
      noAnswer,
      failed,
      avgDuration,
    };
  }, [calls, total]);

  const agentName = (agentId?: string) => {
    if (!agentId) return '—';
    return agents.find((a) => a.id === agentId)?.name || agentId.slice(0, 8);
  };

  const openSession = async (call: CallHistoryItem) => {
    const callKey = String(call.id || call.call_id || '');
    setOpeningCallId(callKey);
    try {
      let detail: any = call;
      try {
        if (callKey) {
          detail = await getCallHistoryItem(callKey);
        }
      } catch {
        /* use list row */
      }

      const sessionId =
        detail.session_id ||
        detail.agent_session_id ||
        detail.room_name ||
        detail.call_id ||
        detail.id ||
        call.call_id ||
        call.id;

      if (!sessionId) {
        throw new Error('No session linked to this call yet');
      }

      // Prefer a real agent session record when available
      let matched: any = null;
      const agentId = detail.agent_id || call.agent_id;
      if (agentId) {
        try {
          const response = await agentAPI.getAgentSessions('page=1&limit=100', agentId);
          const sessions: any[] = response?.sessions || [];
          matched =
            sessions.find((s) => {
              const sid = String(s.session_id || s.id || s.call_id || '');
              return (
                sid === String(sessionId) ||
                sid.includes(String(sessionId)) ||
                String(sessionId).includes(sid)
              );
            }) || null;
        } catch {
          /* ignore — fall back to constructed session */
        }
      }

      setSelectedSession({
        ...(matched || {}),
        session_id: String(matched?.session_id || sessionId),
        id: String(matched?.id || sessionId),
        call_id: String(matched?.call_id || detail.call_id || sessionId),
        agent_id: agentId,
        agent: agentId
          ? { id: agentId, name: detail.agent_name || agentName(agentId) }
          : undefined,
        phone_number: detail.phone_number || contact?.phone_number,
        name: detail.contact_name || contact?.name,
        direction: {
          type: detail.direction || 'outbound',
          number: detail.phone_number || contact?.phone_number,
        },
        duration_seconds: detail.duration_seconds ?? call.duration_seconds,
        created_at: detail.start_time || call.start_time,
        status: detail.status || call.status,
      });
    } catch (err: any) {
      appToast.error(err.message || 'Failed to open session history');
    } finally {
      setOpeningCallId(null);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <GlassCard>
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigate('/call-setup', { state: { callSetupSection: 'contacts' } })}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex-shrink-0"
              title="Back to contacts"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Call History</h2>
                <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 inline-flex items-center gap-1">
                  <History className="w-3 h-3" /> Contact
                </span>
              </div>
              {contactLoading ? (
                <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading contact…
                </p>
              ) : contactError ? (
                <p className="text-sm text-rose-500 mt-1">{contactError}</p>
              ) : (
                <div className="mt-1 space-y-0.5">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    {contact?.name || 'Unknown'}
                  </p>
                  <p className="text-sm font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    {contact?.phone_number || '—'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-1 p-1 rounded-xl common-bg-icons self-start">
            {(
              [
                { id: 'all' as const, label: 'All' },
                { id: 'outbound' as const, label: 'Outbound' },
                { id: 'inbound' as const, label: 'Inbound' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDirection(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  direction === tab.id
                    ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Analytics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {[
          {
            label: 'Total Calls',
            value: stats?.total_calls ?? localAnalytics.total,
            icon: BarChart3,
            color: 'from-blue-500 to-indigo-600',
          },
          {
            label: 'Completed',
            value: localAnalytics.completed,
            icon: CheckCircle,
            color: 'from-emerald-500 to-teal-600',
          },
          {
            label: 'No Answer',
            value: localAnalytics.noAnswer,
            icon: PhoneMissed,
            color: 'from-amber-500 to-orange-600',
          },
          {
            label: 'Avg Duration',
            value: formatDuration(localAnalytics.avgDuration),
            icon: Clock,
            color: 'from-violet-500 to-purple-600',
          },
        ].map((stat) => (
          <GlassCard key={stat.label}>
            <div className="p-3 sm:p-4 flex items-center gap-3">
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center flex-shrink-0`}
              >
                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white leading-tight truncate">
                  {stat.value}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Session / call list */}
      <GlassCard>
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-white">Sessions</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Calls linked to this contact — open any row for transcript & recording
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                loadCalls();
                loadStats();
              }}
              disabled={callsLoading}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>

          {callsLoading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading call history…</span>
            </div>
          ) : callsError ? (
            <div className="text-center py-12 border-2 border-dashed border-rose-200 dark:border-rose-800 rounded-2xl">
              <AlertCircle className="w-6 h-6 text-rose-500 mx-auto mb-3" />
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{callsError}</p>
              <button
                type="button"
                onClick={loadCalls}
                className="common-button-bg2 inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl"
              >
                Try again
              </button>
            </div>
          ) : calls.length === 0 ? (
            <div className="text-center py-14 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
              <History className="w-7 h-7 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-2">
                No calls yet
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                When this contact is dialed (direct call or campaign), sessions will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {calls.map((call) => {
                const key = String(call.id || call.call_id);
                const opening = openingCallId === key;
                const DirIcon = call.direction === 'inbound' ? PhoneIncoming : PhoneOutgoing;
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                        <DirIcon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-slate-800 dark:text-white capitalize">
                            {call.direction || 'call'}
                          </p>
                          <span className={`text-[11px] px-2 py-0.5 rounded-md capitalize ${statusTone(call.status)}`}>
                            {String(call.status || 'unknown').replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                          <span>{formatWhen(call.start_time)}</span>
                          <span>{formatDuration(call.duration_seconds)}</span>
                          {(call.agent_name || call.agent_id) && (
                            <span>Agent: {call.agent_name || agentName(call.agent_id)}</span>
                          )}
                          {call.source_number && (
                            <span className="font-mono">From {call.source_number}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openSession(call)}
                      disabled={opening}
                      className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 flex-shrink-0"
                    >
                      {opening ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                      Session history
                    </button>
                  </motion.div>
                );
              })}

              {totalPages > 1 && (
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalItems={total}
                  itemsPerPage={PAGE_SIZE}
                  onPageChange={setPage}
                  className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700"
                />
              )}
            </div>
          )}
        </div>
      </GlassCard>

      {selectedSession && (
        <SessionTranscriptModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  );
};

export default ContactCallHistory;
