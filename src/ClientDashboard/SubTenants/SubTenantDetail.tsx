import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Users,
  Phone,
  TrendingUp,
  ShieldCheck,
  UserPlus,
  History,
  Eye,
  Pause,
  Play,
  Check,
  Sparkles,
  Bot,
  BarChart3,
  PhoneCall,
} from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import { tenantAPI } from '../../services/tenantAPI';
import type { PermissionGrantMap, PermissionTemplate, Tenant, TenantAuditLogEntry } from '../../permissions/types';
import TenantStatusBadge from './components/TenantStatusBadge';
import PermissionMatrixEditor from './PermissionMatrixEditor';
import InviteLinkModal from './InviteLinkModal';
import SubTenantMembers from './SubTenantMembers';
import SubTenantAgents from './SubTenantAgents';
import Analytics from '../Analytics/Analytics';
import CallSetup from '../Workflows/CallSetup';
import { useTenantView } from '../../permissions/TenantViewContext';

type TabId = 'overview' | 'permissions' | 'members' | 'activity' | 'agents' | 'analytics' | 'call-setup';

const TABS: Array<{ id: TabId; label: string; icon: typeof Building2 }> = [
  { id: 'overview', label: 'Overview', icon: Building2 },
  { id: 'permissions', label: 'Permissions', icon: ShieldCheck },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'activity', label: 'Activity', icon: History },
  { id: 'agents', label: 'AI Employees', icon: Bot },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'call-setup', label: 'Call Setup', icon: PhoneCall },
];

const SubTenantDetail = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const { enterView } = useTenantView();
  const [tab, setTab] = useState<TabId>('overview');
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [grants, setGrants] = useState<PermissionGrantMap>({});
  const [templates, setTemplates] = useState<PermissionTemplate[]>([]);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);
  const [permissionsSaved, setPermissionsSaved] = useState(false);
  const [auditLog, setAuditLog] = useState<TenantAuditLogEntry[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [membersRefreshToken, setMembersRefreshToken] = useState(0);

  useEffect(() => {
    if (!tenantId) return;
    setIsLoading(true);
    Promise.all([
      tenantAPI.getTenant(tenantId),
      tenantAPI.getPermissions(tenantId),
      tenantAPI.listTemplates(),
      tenantAPI.getAuditLog(tenantId),
    ])
      .then(([t, p, tpl, log]) => {
        setTenant(t);
        setGrants(p.grants);
        setTemplates(tpl);
        setAuditLog(log);
      })
      .finally(() => setIsLoading(false));
  }, [tenantId]);

  const handleSavePermissions = async () => {
    if (!tenantId) return;
    setIsSavingPermissions(true);
    try {
      await tenantAPI.setPermissions(tenantId, grants);
      setPermissionsSaved(true);
      setTimeout(() => setPermissionsSaved(false), 2500);
    } finally {
      setIsSavingPermissions(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!tenant) return;
    setIsTogglingStatus(true);
    try {
      const nextStatus = tenant.status === 'suspended' ? 'active' : 'suspended';
      const updated = await tenantAPI.updateTenantStatus(tenant.id, nextStatus);
      setTenant(updated);
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const grantedCount = useMemo(() => Object.values(grants).filter(Boolean).length, [grants]);

  if (isLoading || !tenant) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-slate-300 dark:border-slate-600 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => navigate('/sub-tenants')}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> All Sub Tenants
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 dark:from-slate-500 dark:to-slate-700 flex items-center justify-center shadow-sm flex-shrink-0">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">{tenant.name}</h2>
              <TenantStatusBadge status={tenant.status} />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">/{tenant.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" /> Invite Member
          </button>
          <button
            type="button"
            onClick={handleToggleStatus}
            disabled={isTogglingStatus}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors disabled:opacity-50 ${
              tenant.status === 'suspended'
                ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80'
                : 'bg-white dark:bg-slate-800 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20'
            }`}
          >
            {tenant.status === 'suspended' ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            {tenant.status === 'suspended' ? 'Reactivate' : 'Suspend'}
          </button>
          <button
            type="button"
            onClick={async () => {
              await enterView(tenant);
              navigate('/dashboard');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-colors"
          >
            <Eye className="w-3.5 h-3.5" /> View as {tenant.name.split(' ')[0]}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 p-1.5 rounded-xl bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300/70 dark:border-slate-700 w-full sm:w-auto overflow-x-auto">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
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

      {tab === 'overview' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Active Employees', value: tenant.usage.activeAgents, icon: Users },
              { label: 'Calls This Month', value: tenant.usage.callsThisMonth, icon: Phone },
              { label: 'Success Rate', value: `${tenant.usage.successRate}%`, icon: TrendingUp },
              { label: 'Team Members', value: tenant.usage.activeUsers, icon: Users },
            ].map((stat) => (
              <GlassCard key={stat.label} className="p-4">
                <div className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center mb-2">
                  <stat.icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </div>
                <p className="text-lg font-bold text-slate-800 dark:text-white leading-tight">{stat.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
              </GlassCard>
            ))}
          </div>

          <GlassCard className="p-4">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-3">Company & Contact</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-3 text-sm">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Owner / Contact</p>
                <p className="font-medium text-slate-800 dark:text-white">{tenant.contact.ownerName || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Email</p>
                <p className="font-medium text-slate-800 dark:text-white truncate">{tenant.contact.email || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Phone</p>
                <p className="font-medium text-slate-800 dark:text-white">{tenant.contact.phone || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Location</p>
                <p className="font-medium text-slate-800 dark:text-white">{tenant.contact.location || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Industry</p>
                <p className="font-medium text-slate-800 dark:text-white">{tenant.contact.industry || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Website</p>
                <p className="font-medium text-slate-800 dark:text-white truncate">{tenant.contact.website || '—'}</p>
              </div>
            </div>
            {tenant.contact.notes && (
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Notes</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">{tenant.contact.notes}</p>
              </div>
            )}
          </GlassCard>

          <GlassCard className="p-4">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-3">Resource Limits</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Max Employees</p>
                <p className="font-medium text-slate-800 dark:text-white">{tenant.limits.maxAgents ?? 'Unlimited'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Max Team Members</p>
                <p className="font-medium text-slate-800 dark:text-white">{tenant.limits.maxUsers ?? 'Unlimited'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Billing</p>
                <p className="font-medium text-slate-800 dark:text-white">
                  {tenant.billing.mode === 'CENTRAL' ? 'Billed to you' : 'Pass-through'}
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {tab === 'permissions' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
            <p className="text-xs text-indigo-700 dark:text-indigo-300">
              {grantedCount} permission{grantedCount === 1 ? '' : 's'} currently granted. Changes apply once you save.
            </p>
          </div>
          <PermissionMatrixEditor grants={grants} onChange={setGrants} templates={templates} />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSavePermissions}
              disabled={isSavingPermissions}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-colors disabled:opacity-50"
            >
              {permissionsSaved ? <Check className="w-4 h-4" /> : null}
              {isSavingPermissions ? 'Saving…' : permissionsSaved ? 'Saved' : 'Save Permissions'}
            </button>
          </div>
        </div>
      )}

      {tab === 'members' && (
        <SubTenantMembers
          tenantId={tenant.id}
          onInvite={() => setShowInviteModal(true)}
          refreshToken={membersRefreshToken}
        />
      )}

      {tab === 'activity' && (
        <GlassCard className="p-2 sm:p-3">
          {auditLog.length === 0 ? (
            <div className="text-center py-8">
              <History className="w-7 h-7 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">No activity recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {auditLog.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                    <Eye className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 dark:text-white">{entry.action}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{entry.detail}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                      {entry.actorName} · {new Date(entry.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      )}

      {tab === 'agents' && <SubTenantAgents tenantId={tenant.id} companyName={tenant.name} />}

      {tab === 'analytics' && <Analytics />}

      {tab === 'call-setup' && <CallSetup />}

      <InviteLinkModal
        open={showInviteModal}
        tenantId={tenant.id}
        onClose={() => {
          setShowInviteModal(false);
          setMembersRefreshToken((n) => n + 1);
        }}
      />
    </div>
  );
};

export default SubTenantDetail;
