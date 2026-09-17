import { useEffect, useMemo, useState } from 'react';
import {
  Headset,
  PhoneCall,
  Users,
  CheckSquare,
  Activity as ActivityIcon,
  Building2,
  ChevronDown,
  TrendingUp,
  Clock,
} from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import { useAuth } from '../../contexts/AuthContext';
import { useTenantView } from '../../permissions/TenantViewContext';
import { listSubTenants } from '../../services/subTenantsAPI';
import { getCallStats, seedMockData } from '../../services/commandCenterAPI';
import type { Tenant } from '../../permissions/types';
import CommandCenterAllCalls from './CommandCenterAllCalls';
import CommandCenterLeads from './CommandCenterLeads';
import CommandCenterFollowUps from './CommandCenterFollowUps';
import CommandCenterActivity from './CommandCenterActivity';

type TabId = 'calls' | 'leads' | 'follow-ups' | 'activity';

const TABS: Array<{ id: TabId; label: string; icon: typeof PhoneCall }> = [
  { id: 'calls', label: 'All Calls', icon: PhoneCall },
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'follow-ups', label: 'Follow-ups', icon: CheckSquare },
  { id: 'activity', label: 'Employee Activity', icon: ActivityIcon },
];

/**
 * Command Center — a human employee's combined workspace over calls, leads,
 * follow-ups and team activity. A sub-tenant scope dropdown lets a manager
 * working across several sub-tenants (celebrities) narrow the whole view; the
 * main tenant sees every sub-tenant, a sub-tenant sees only their own.
 */
const CommandCenter = () => {
  const { user } = useAuth();
  const { isViewing, tenant: viewedTenant } = useTenantView();

  const isSubTenant =
    user?.tenantRole === 'SUBTENANT_OWNER' || user?.tenantRole === 'SUBTENANT_MEMBER';

  const [tab, setTab] = useState<TabId>('calls');
  const [subTenants, setSubTenants] = useState<Tenant[]>([]);
  // '' = all sub-tenants (main tenant only).
  const [scopeTenantId, setScopeTenantId] = useState<string>('');
  const [stats, setStats] = useState<{ total?: number; inbound?: number; outbound?: number; avgDuration?: number }>({});

  // Load sub-tenants for the scope dropdown (main tenant only). A sub-tenant is
  // already scoped to itself; a "View as" preview locks to the viewed tenant.
  useEffect(() => {
    if (isSubTenant) return;
    listSubTenants({ limit: 100 })
      .then(setSubTenants)
      .catch(() => setSubTenants([]));
  }, [isSubTenant]);

  // When previewing a specific sub-tenant, lock scope to them.
  useEffect(() => {
    if (isViewing && viewedTenant) setScopeTenantId(viewedTenant.id);
  }, [isViewing, viewedTenant]);

  // Seed demo follow-ups & activity once so those tabs aren't empty.
  useEffect(() => {
    seedMockData(String(user?.tenantId || user?.id || 'me'));
  }, [user?.tenantId, user?.id]);

  // KPI strip from real call-history stats (best-effort).
  useEffect(() => {
    getCallStats()
      .then((s: any) =>
        setStats({
          total: s.total ?? s.total_calls ?? s.count,
          inbound: s.inbound ?? s.inbound_calls,
          outbound: s.outbound ?? s.outbound_calls,
          avgDuration: s.avg_duration_seconds ?? s.average_duration_seconds,
        })
      )
      .catch(() => setStats({}));
  }, []);

  const scopeOptions = useMemo(
    () => [{ value: '', label: 'All Sub Tenants' }, ...subTenants.map((t) => ({ value: t.id, label: t.name }))],
    [subTenants]
  );

  const activeScopeLabel =
    scopeOptions.find((o) => o.value === scopeTenantId)?.label || 'All Sub Tenants';

  const kpis = [
    { label: 'Total Calls', value: stats.total ?? '—', icon: PhoneCall },
    { label: 'Inbound', value: stats.inbound ?? '—', icon: TrendingUp },
    { label: 'Outbound', value: stats.outbound ?? '—', icon: TrendingUp },
    {
      label: 'Avg Duration',
      value: stats.avgDuration != null ? `${Math.round(stats.avgDuration)}s` : '—',
      icon: Clock,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-sm flex-shrink-0">
            <Headset className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">Command Center</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Calls, leads, follow-ups and team activity in one place.
            </p>
          </div>
        </div>

        {/* Sub-tenant scope dropdown — main tenant only, and disabled while
            previewing a specific sub-tenant. */}
        {!isSubTenant && (
          <div className="relative w-full sm:w-64">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
            <select
              value={scopeTenantId}
              onChange={(e) => setScopeTenantId(e.target.value)}
              disabled={isViewing}
              className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white appearance-none outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-60 cursor-pointer"
              title={isViewing ? `Locked to ${activeScopeLabel}` : 'Filter by sub-tenant'}
            >
              {scopeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        )}
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <GlassCard key={k.label} className="p-4">
            <div className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center mb-2">
              <k.icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            </div>
            <p className="text-lg font-bold text-slate-800 dark:text-white leading-tight">{k.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{k.label}</p>
          </GlassCard>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 p-1.5 rounded-xl bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300/70 dark:border-slate-700 w-full sm:w-auto overflow-x-auto no-scrollbar">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                active
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <t.icon className={`w-3.5 h-3.5 ${active ? 'opacity-100' : 'opacity-70'}`} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === 'calls' && <CommandCenterAllCalls scopeTenantId={scopeTenantId} />}
      {tab === 'leads' && <CommandCenterLeads scopeTenantId={scopeTenantId} />}
      {tab === 'follow-ups' && <CommandCenterFollowUps scopeTenantId={scopeTenantId} />}
      {tab === 'activity' && <CommandCenterActivity scopeTenantId={scopeTenantId} />}
    </div>
  );
};

export default CommandCenter;
