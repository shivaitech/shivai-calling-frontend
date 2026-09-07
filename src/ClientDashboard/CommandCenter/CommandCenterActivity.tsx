import { useEffect, useMemo, useState } from 'react';
import {
  Activity as ActivityIcon,
  PhoneCall,
  UserPlus,
  Pencil,
  CheckSquare,
  StickyNote,
  Search,
} from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import { useAuth } from '../../contexts/AuthContext';
import { activityStore, type ActivityEntry, type ActivityKind } from '../../services/commandCenterAPI';

interface Props {
  scopeTenantId: string;
}

const kindMeta: Record<ActivityKind, { label: string; Icon: typeof PhoneCall; cls: string }> = {
  call_handled: { label: 'Call', Icon: PhoneCall, cls: 'text-blue-600 dark:text-blue-400' },
  lead_created: { label: 'Lead', Icon: UserPlus, cls: 'text-emerald-600 dark:text-emerald-400' },
  lead_updated: { label: 'Lead', Icon: Pencil, cls: 'text-amber-600 dark:text-amber-400' },
  follow_up_created: { label: 'Follow-up', Icon: CheckSquare, cls: 'text-violet-600 dark:text-violet-400' },
  follow_up_completed: { label: 'Follow-up', Icon: CheckSquare, cls: 'text-emerald-600 dark:text-emerald-400' },
  note_added: { label: 'Note', Icon: StickyNote, cls: 'text-slate-500 dark:text-slate-400' },
};

const fmtWhen = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const KIND_FILTERS: Array<{ id: 'all' | ActivityKind; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'call_handled', label: 'Calls' },
  { id: 'lead_created', label: 'Leads' },
  { id: 'follow_up_completed', label: 'Follow-ups' },
  { id: 'note_added', label: 'Notes' },
];

const CommandCenterActivity = ({ scopeTenantId }: Props) => {
  const { user } = useAuth();
  const tenantId = scopeTenantId || String(user?.tenantId || user?.id || 'me');

  const [rows, setRows] = useState<ActivityEntry[]>([]);
  const [kind, setKind] = useState<'all' | ActivityKind>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setRows(activityStore.list(tenantId));
  }, [tenantId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter((r) => {
        if (kind === 'all') return true;
        if (kind === 'follow_up_completed') return r.kind === 'follow_up_completed' || r.kind === 'follow_up_created';
        if (kind === 'lead_created') return r.kind === 'lead_created' || r.kind === 'lead_updated';
        return r.kind === kind;
      })
      .filter((r) => (q ? `${r.actorName} ${r.summary} ${r.target || ''}`.toLowerCase().includes(q) : true));
  }, [rows, kind, search]);

  // Group by actor for a per-employee view.
  const byActor = useMemo(() => {
    const map = new Map<string, ActivityEntry[]>();
    for (const r of filtered) {
      const key = r.actorName || 'Unknown';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="space-y-3">
      <GlassCard className="p-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search activity by employee or target…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-violet-500/40 text-slate-800 dark:text-white"
            />
          </div>
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {KIND_FILTERS.map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => setKind(k.id)}
                className={`px-3 py-2.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  kind === k.id
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                }`}
              >
                {k.label}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {filtered.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <ActivityIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No activity yet. Actions your team takes here (follow-ups, notes) will appear as a feed the main tenant can monitor.
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {byActor.map(([actor, entries]) => (
            <GlassCard key={actor} className="overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center text-[11px] font-semibold">
                  {actor.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-slate-800 dark:text-white">{actor}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500">· {entries.length} actions</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {entries.map((e) => {
                  const m = kindMeta[e.kind];
                  return (
                    <div key={e.id} className="flex items-center gap-3 px-4 py-2.5">
                      <div className={`w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center flex-shrink-0 ${m.cls}`}>
                        <m.Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-800 dark:text-white truncate">{e.summary}</p>
                        {e.target && <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{e.target}</p>}
                      </div>
                      <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">{fmtWhen(e.at)}</span>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommandCenterActivity;
