import { useEffect, useState } from 'react';
import { Search, Loader2, Users, PhoneCall, Mail, ArrowDownUp } from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import Pagination from '../../components/Pagination';
import { listLeads, type TenantContact } from '../../services/commandCenterAPI';

interface Props {
  scopeTenantId: string;
}

type Direction = 'all' | 'inbound' | 'outbound' | 'both';

const PAGE_SIZE = 20;

const directionBadge = (dir?: string) => {
  if (dir === 'inbound') return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
  if (dir === 'outbound') return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
  return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700';
};

const fmtDate = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const CommandCenterLeads = ({ scopeTenantId }: Props) => {
  const [leads, setLeads] = useState<TenantContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [direction, setDirection] = useState<Direction>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [search, setSearch] = useState('');
  const [sortNewest, setSortNewest] = useState(true);

  const load = () => {
    setLoading(true);
    setError(null);
    listLeads({
      page,
      limit: PAGE_SIZE,
      direction,
      search: search || undefined,
      ...(scopeTenantId ? ({ sub_tenant_id: scopeTenantId } as any) : {}),
    })
      .then((res) => {
        const rows = [...res.data].sort((a, b) => {
          const av = new Date(a.created_at || 0).getTime();
          const bv = new Date(b.created_at || 0).getTime();
          return sortNewest ? bv - av : av - bv;
        });
        setLeads(rows);
        setTotal(res.total);
        setTotalPages(Math.max(1, Math.ceil(res.total / PAGE_SIZE)));
      })
      .catch((e) => setError(e?.message || 'Failed to load leads'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, direction, search, sortNewest, scopeTenantId]);

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direction, search, scopeTenantId]);

  return (
    <div className="space-y-3">
      {/* Filters */}
      <GlassCard className="p-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setSearch(searchTerm.trim())}
              placeholder="Search leads by name or number… (Enter)"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-violet-500/40 text-slate-800 dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              {(['all', 'inbound', 'outbound', 'both'] as Direction[]).map((d) => (
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
              onClick={() => setSortNewest((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60"
              title="Toggle sort order"
            >
              <ArrowDownUp className="w-3.5 h-3.5" /> {sortNewest ? 'Newest' : 'Oldest'}
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Results */}
      <GlassCard className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-rose-600 dark:text-rose-400">{error}</div>
        ) : leads.length === 0 ? (
          <div className="p-10 text-center">
            <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400">No leads match your filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {leads.map((lead) => (
              <div key={lead.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                  {(lead.name || '?').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{lead.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-2">
                    <span className="inline-flex items-center gap-1"><PhoneCall className="w-3 h-3" /> {lead.phone_number || '—'}</span>
                    {lead.email && <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" /> {lead.email}</span>}
                  </p>
                </div>
                <span className="hidden sm:block text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">{fmtDate(lead.created_at)}</span>
                {lead.direction && (
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border capitalize flex-shrink-0 ${directionBadge(lead.direction)}`}>
                    {lead.direction}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">{total} leads</p>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
};

export default CommandCenterLeads;
