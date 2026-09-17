import { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  PhoneIncoming,
  PhoneOutgoing,
  Globe,
  Clock,
  ChevronDown,
  Loader2,
  X,
  Building2,
} from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import Pagination from '../../components/Pagination';
import ModalOverlay from '../../components/ModalOverlay';
import { listCalls, type CommandCenterCall } from '../../services/commandCenterAPI';

interface Props {
  scopeTenantId: string;
}

type Direction = 'all' | 'inbound' | 'outbound';

const PAGE_SIZE = 20;

const directionMeta = (dir?: string) => {
  if (dir === 'inbound') return { label: 'Inbound', Icon: PhoneIncoming, cls: 'text-emerald-600 dark:text-emerald-400' };
  if (dir === 'outbound') return { label: 'Outbound', Icon: PhoneOutgoing, cls: 'text-blue-600 dark:text-blue-400' };
  return { label: 'Web', Icon: Globe, cls: 'text-slate-500 dark:text-slate-400' };
};

const statusBadge = (status?: string) => {
  const s = (status || '').toLowerCase();
  if (['completed', 'success', 'answered'].includes(s))
    return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
  if (['failed', 'no-answer', 'no_answer', 'busy', 'missed'].includes(s))
    return 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
  return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700';
};

const fmtDuration = (s?: number) => {
  if (s == null) return '—';
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return m ? `${m}m ${sec}s` : `${sec}s`;
};

const fmtWhen = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const CommandCenterAllCalls = ({ scopeTenantId }: Props) => {
  const [calls, setCalls] = useState<CommandCenterCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [direction, setDirection] = useState<Direction>('all');
  const [status, setStatus] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [search, setSearch] = useState(''); // committed on Enter
  const [showFilters, setShowFilters] = useState(false);

  const [detail, setDetail] = useState<CommandCenterCall | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    listCalls({
      page,
      limit: PAGE_SIZE,
      direction,
      status: status !== 'all' ? status : undefined,
      from: from || undefined,
      to: to || undefined,
      phone_number: search || undefined,
      // Scope by sub-tenant when the backend supports it (harmless if ignored).
      ...(scopeTenantId ? ({ sub_tenant_id: scopeTenantId } as any) : {}),
    })
      .then((res) => {
        setCalls(res.calls);
        setTotalPages(res.pagination.total_pages || 1);
        setTotal(res.pagination.total || res.calls.length);
      })
      .catch((e) => setError(e?.message || 'Failed to load calls'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, direction, status, from, to, search, scopeTenantId]);

  // Reset to page 1 whenever a filter changes.
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direction, status, from, to, search, scopeTenantId]);

  const activeFilterCount =
    (direction !== 'all' ? 1 : 0) + (status !== 'all' ? 1 : 0) + (from ? 1 : 0) + (to ? 1 : 0) + (search ? 1 : 0);

  const clearFilters = () => {
    setDirection('all');
    setStatus('all');
    setFrom('');
    setTo('');
    setSearch('');
    setSearchTerm('');
  };

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <GlassCard className="p-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setSearch(searchTerm.trim())}
              placeholder="Search by phone number… (press Enter)"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-violet-500/40 text-slate-800 dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            {/* Direction pills */}
            <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              {(['all', 'inbound', 'outbound'] as Direction[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDirection(d)}
                  className={`px-3 py-2.5 text-xs font-medium capitalize transition-colors ${
                    direction === d
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60"
            >
              <Filter className="w-3.5 h-3.5" /> Filters
              {activeFilterCount > 0 && (
                <span className="ml-0.5 min-w-4 h-4 px-1 rounded-full bg-violet-600 text-white text-[10px] flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-violet-500/40"
              >
                <option value="all">All statuses</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="no-answer">No answer</option>
                <option value="busy">Busy</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">From</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-violet-500/40" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">To</label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-violet-500/40" />
            </div>
            {activeFilterCount > 0 && (
              <div className="sm:col-span-3">
                <button type="button" onClick={clearFilters} className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline">
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </GlassCard>

      {/* Results */}
      <GlassCard className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-rose-600 dark:text-rose-400">{error}</div>
        ) : calls.length === 0 ? (
          <div className="p-10 text-center">
            <PhoneIncoming className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400">No calls match your filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {calls.map((c) => {
              const dm = directionMeta(c.direction);
              return (
                <button
                  key={c.id || c.call_id || c.session_id}
                  type="button"
                  onClick={() => setDetail(c)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <div className={`w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center flex-shrink-0 ${dm.cls}`}>
                    <dm.Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-slate-800 dark:text-white truncate">
                        {c.contact_name || c.phone_number || c.source_number || 'Unknown'}
                      </p>
                      {c.tenant_name && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                          <Building2 className="w-2.5 h-2.5" /> {c.tenant_name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {c.phone_number || c.source_number || ''}{c.phone_number ? ' · ' : ''}
                      {c.agent_name ? `${c.agent_name} · ` : ''}{dm.label} · {fmtWhen(c.start_time)}
                      {c.outcome ? ` · ${c.outcome}` : ''}
                    </p>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
                    <Clock className="w-3 h-3" /> {fmtDuration(c.duration_seconds)}
                  </span>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border flex-shrink-0 ${statusBadge(c.status)}`}>
                    {c.status || '—'}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </GlassCard>

      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">{total} calls</p>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* Detail modal */}
      <ModalOverlay open={!!detail} onClose={() => setDetail(null)} panelClassName="max-w-lg">
        {detail && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-800 dark:text-white">
                  {detail.contact_name || detail.phone_number || 'Call detail'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{fmtWhen(detail.start_time)}</p>
              </div>
              <button onClick={() => setDetail(null)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              {[
                ['Sub Tenant', detail.tenant_name || '—'],
                ['Direction', directionMeta(detail.direction).label],
                ['Status', detail.status || '—'],
                ['Outcome', detail.outcome || '—'],
                ['Duration', fmtDuration(detail.duration_seconds)],
                ['Agent', detail.agent_name || '—'],
                ['Phone', detail.phone_number || detail.source_number || '—'],
                ['Language', detail.language || '—'],
                ['Started', fmtWhen(detail.start_time)],
                ['Ended', fmtWhen(detail.end_time)],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                  <p className="font-medium text-slate-800 dark:text-white break-words">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </ModalOverlay>
    </div>
  );
};

export default CommandCenterAllCalls;
