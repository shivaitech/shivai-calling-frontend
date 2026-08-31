import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Search,
  Plus,
  Users,
  Phone,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Clock,
  Pause,
  Play,
  MoreVertical,
  Settings as SettingsIcon,
  X,
} from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import ModalOverlay from '../../components/ModalOverlay';
import SearchableSelect from '../../components/SearchableSelect';
import Pagination from '../../components/Pagination';
import { tenantAPI } from '../../services/tenantAPI';
import type { Tenant, TenantStatus } from '../../permissions/types';
import SectionHeader from './components/SectionHeader';
import TenantStatusBadge from './components/TenantStatusBadge';
import CreateSubTenantModal from './CreateSubTenantModal';
import BrandingTab from '../Settings/BrandingTab';

const PAGE_SIZE = 8;

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days < 1) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mo ago`;
  return `${Math.floor(months / 12)} yr ago`;
}

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

const SubTenantsList = () => {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TenantStatus>('all');
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBrandingModal, setShowBrandingModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [busyTenantId, setBusyTenantId] = useState<string | null>(null);

  const loadTenants = async () => {
    setIsLoading(true);
    try {
      const data = await tenantAPI.listSubTenants();
      setTenants(data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (tenant: Tenant) => {
    setOpenMenuId(null);
    setBusyTenantId(tenant.id);
    try {
      const nextStatus = tenant.status === 'suspended' ? 'active' : 'suspended';
      const updated = await tenantAPI.updateTenantStatus(tenant.id, nextStatus);
      setTenants((prev) => prev.map((t) => (t.id === tenant.id ? updated : t)));
    } finally {
      setBusyTenantId(null);
    }
  };

  useEffect(() => {
    loadTenants();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tenants.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (!q) return true;
      return t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q);
    });
  }, [tenants, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totals = useMemo(
    () => ({
      count: tenants.length,
      activeAgents: tenants.reduce((sum, t) => sum + t.usage.activeAgents, 0),
      callsThisMonth: tenants.reduce((sum, t) => sum + t.usage.callsThisMonth, 0),
    }),
    [tenants],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <SectionHeader
          icon={Building2}
          title="Sub Tenants"
          subtitle="Manage the businesses running their own ShivAI panel under your account"
        />
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setShowBrandingModal(true)}
            title="Panel branding (logo & colors) applies to all sub-tenants"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors"
          >
            <SettingsIcon className="w-4 h-4" /> Settings
          </button>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Sub Tenant
          </button>
        </div>
      </div>

      {/* Preview banner — mock data until the tenant API is live */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
        <Sparkles className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
        <p className="text-xs text-indigo-700 dark:text-indigo-300">
          Preview with sample data — will reflect your real sub-tenants once the tenant API is live.
        </p>
      </div>

      {/* Summary stat tiles — bordered no-fill badges per established icon convention */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Sub Tenants', value: totals.count, icon: Building2 },
          { label: 'Active Employees', value: totals.activeAgents, icon: Users },
          { label: 'Calls This Month', value: totals.callsThisMonth, icon: Phone },
        ].map((stat) => (
          <GlassCard key={stat.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                <stat.icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold text-slate-800 dark:text-white leading-tight">{stat.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Search + filter */}
      <GlassCard>
        <div className="p-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 z-10" />
              <input
                type="text"
                placeholder="Search sub-tenants by name…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white text-sm transition-all"
              />
            </div>
            <div className="hidden sm:block min-w-[160px]">
              <SearchableSelect
                options={[
                  { value: 'all', label: 'All statuses' },
                  { value: 'active', label: 'Active' },
                  { value: 'suspended', label: 'Suspended' },
                  { value: 'pending_invite', label: 'Invite Pending' },
                ]}
                value={statusFilter}
                onChange={(v) => {
                  setStatusFilter(v as 'all' | TenantStatus);
                  setPage(1);
                }}
                placeholder="Filter by status…"
              />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Cards */}
      {isLoading ? (
        <GlassCard className="p-2 sm:p-3">
          <div className="text-center py-10">
            <div className="w-6 h-6 border-2 border-slate-300 dark:border-slate-600 border-t-violet-600 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading sub-tenants…</p>
          </div>
        </GlassCard>
      ) : paged.length === 0 ? (
        <GlassCard className="p-2 sm:p-3">
          <div className="text-center py-10">
            <Building2 className="w-7 h-7 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {tenants.length === 0 ? 'No sub-tenants yet — add your first one to get started.' : 'No sub-tenants match your search'}
            </p>
          </div>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {paged.map((tenant) => {
            const agentLimit = tenant.limits.maxAgents;
            const agentPct = agentLimit ? Math.min(100, Math.round((tenant.usage.activeAgents / agentLimit) * 100)) : null;
            const nearLimit = agentPct !== null && agentPct >= 80;
            const isBusy = busyTenantId === tenant.id;

            return (
              <GlassCard key={tenant.id} hover className="group p-0 overflow-visible relative">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/sub-tenants/${tenant.id}`)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate(`/sub-tenants/${tenant.id}`)}
                  className="outline-none p-3.5 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 dark:from-slate-500 dark:to-slate-700 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="text-xs font-bold text-white">{initials(tenant.name)}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{tenant.name}</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">/{tenant.slug}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                  </div>

                  <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                    <TenantStatusBadge status={tenant.status} />
                    {nearLimit && tenant.status === 'active' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 whitespace-nowrap">
                        Near plan limit
                      </span>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="rounded-lg border border-slate-200/80 dark:border-slate-700/80 px-2 py-1.5 text-center">
                      <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{tenant.usage.activeAgents}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-0.5"><Users className="w-2.5 h-2.5" />Employees</p>
                    </div>
                    <div className="rounded-lg border border-slate-200/80 dark:border-slate-700/80 px-2 py-1.5 text-center">
                      <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{tenant.usage.callsThisMonth}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-0.5"><Phone className="w-2.5 h-2.5" />Calls</p>
                    </div>
                    <div className="rounded-lg border border-slate-200/80 dark:border-slate-700/80 px-2 py-1.5 text-center">
                      <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{tenant.usage.successRate > 0 ? `${tenant.usage.successRate}%` : '—'}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-0.5"><TrendingUp className="w-2.5 h-2.5" />Success</p>
                    </div>
                  </div>

                  {agentLimit && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 mb-1">
                        <span>Employee usage</span>
                        <span>{tenant.usage.activeAgents}/{agentLimit}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${nearLimit ? 'bg-amber-500' : 'bg-violet-500'}`}
                          style={{ width: `${agentPct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Added {relativeTime(tenant.createdAt)}</span>
                  </div>
                </div>

                {/* Quick actions menu */}
                <div className="absolute top-3 right-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId((prev) => (prev === tenant.id ? null : tenant.id));
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100 data-[open=true]:opacity-100"
                    data-open={openMenuId === tenant.id}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {openMenuId === tenant.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                      <div className="absolute right-0 top-8 z-20 w-40 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg py-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(null);
                            navigate(`/sub-tenants/${tenant.id}`);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                        >
                          <ChevronRight className="w-3.5 h-3.5" /> View Details
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(tenant);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 disabled:opacity-50"
                        >
                          {tenant.status === 'suspended' ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                          {tenant.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <GlassCard className="p-3">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={filtered.length}
            itemsPerPage={PAGE_SIZE}
            onPageChange={setPage}
          />
        </GlassCard>
      )}

      <CreateSubTenantModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => {
          setShowCreateModal(false);
          loadTenants();
        }}
      />

      <ModalOverlay open={showBrandingModal} onClose={() => setShowBrandingModal(false)} closeOnBackdrop panelClassName="max-w-3xl">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-white">Panel Settings</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Logo and colors shown across all of your sub-tenants' panels.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowBrandingModal(false)}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex-shrink-0"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto">
            <BrandingTab />
          </div>
        </div>
      </ModalOverlay>
    </div>
  );
};

export default SubTenantsList;
