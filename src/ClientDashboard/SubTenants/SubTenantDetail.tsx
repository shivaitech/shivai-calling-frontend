import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Users,
  Phone,
  TrendingUp,
  ShieldCheck,
  History,
  Pause,
  Play,
  Check,
  Sparkles,
  Bot,
  BarChart3,
  PhoneCall,
  Trash2,
  Loader2,
  Settings as SettingsIcon,
  Briefcase,
  Globe,
  MapPin,
  Image as ImageIcon,
  Upload,
  X,
  Save,
} from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import SearchableSelect from '../../components/SearchableSelect';
import { tenantAPI } from '../../services/tenantAPI';
import { getSubTenant, reactivateSubTenant, updateSubTenant, updateSubTenantPermissions, deleteSubTenant, toTenant, grantMapFromRecord } from '../../services/subTenantsAPI';
import { getCitiesForCountry } from '../../services/locationCitiesAPI';
import { agentAPI } from '../../services/agentAPI';
import { defaultCountries } from '../../types/country';
import { withLockedGrants } from '../../permissions/registry';
import ModalOverlay from '../../components/ModalOverlay';
import appToast from '../../components/AppToast';
import type { PermissionGrantMap, Tenant, TenantAuditLogEntry } from '../../permissions/types';
import TenantStatusBadge from './components/TenantStatusBadge';
import PermissionMatrixEditor from './PermissionMatrixEditor';
import SubTenantAgents from './SubTenantAgents';
import Analytics from '../Analytics/Analytics';
import CallSetup from '../Workflows/CallSetup';

const INDUSTRY_OPTIONS = [
  'Healthcare',
  'Real Estate',
  'Legal Services',
  'Automotive Services',
  'Retail / E-commerce',
  'Hospitality',
  'Education',
  'Finance & Insurance',
  'Home Services',
  'Other',
].map((v) => ({ value: v, label: v }));

const COUNTRY_OPTIONS = defaultCountries
  .map((c) => ({ value: c.name, label: `${c.flag} ${c.name}` }))
  .sort((a, b) => a.label.localeCompare(b.label));

const ST_INPUT =
  'w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-violet-500/40 text-slate-800 dark:text-white';

type TabId = 'overview' | 'settings' | 'permissions' | 'activity' | 'agents' | 'analytics' | 'call-setup';

const TABS: Array<{ id: TabId; label: string; icon: typeof Building2 }> = [
  { id: 'overview', label: 'Overview', icon: Building2 },
  { id: 'permissions', label: 'Permissions', icon: ShieldCheck },
  { id: 'agents', label: 'AI Employees', icon: Bot },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'call-setup', label: 'Call Setup', icon: PhoneCall },
  { id: 'activity', label: 'Activity', icon: History },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

const SubTenantDetail = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabId>('overview');
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [grants, setGrants] = useState<PermissionGrantMap>({});
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);
  const [permissionsSaved, setPermissionsSaved] = useState(false);
  const [auditLog, setAuditLog] = useState<TenantAuditLogEntry[]>([]);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Business profile + plan the parent tenant can edit for this sub-tenant.
  const [business, setBusiness] = useState({
    businessName: '', industry: '', phone: '', website: '', logo: '',
    address: '', country: '', city: '', state: '', zip: '', description: '',
    maxEmployees: '' as number | string, maxUsers: '' as number | string,
  });
  const [businessCities, setBusinessCities] = useState<string[]>([]);
  const [businessCitiesLoading, setBusinessCitiesLoading] = useState(false);
  const [businessCitiesError, setBusinessCitiesError] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [isSavingBusiness, setIsSavingBusiness] = useState(false);

  const load = () => {
    if (!tenantId) return;
    setIsLoading(true);
    setLoadError(null);
    // Tenant detail + granted permissions come from the real API (one call).
    // Grants are derived from the record's permission.permissions array so the
    // matrix editor prefills. Audit has no real endpoint yet, so it falls
    // back to the mock and never breaks the page load.
    Promise.all([
      getSubTenant(tenantId),
      tenantAPI.getAuditLog(tenantId).catch(() => [] as TenantAuditLogEntry[]),
    ])
      .then(([record, log]) => {
        setTenant(toTenant(record));
        // Force always-on modules (Dashboard) so the map matches the locked UI.
        setGrants(withLockedGrants(grantMapFromRecord(record)));
        setAuditLog(log);
        // Seed the editable business form from the record's tenant detail.
        const d = record.tenantDetail || {};
        setBusiness({
          businessName: d.businessName || '',
          industry: d.industry || '',
          phone: d.phone || '',
          website: d.website || '',
          logo: d.logo || '',
          address: d.address || '',
          country: d.country || '',
          city: d.city || '',
          state: d.state || '',
          zip: d.zip || '',
          description: d.description || '',
          maxEmployees: d.maxEmployees ?? '',
          maxUsers: '',
        });
        if (d.country) {
          getCitiesForCountry(d.country)
            .then(setBusinessCities)
            .catch(() => setBusinessCitiesError(true));
        }
      })
      .catch((err: any) => setLoadError(err?.message || 'Failed to load this sub-tenant'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const handleSavePermissions = async () => {
    if (!tenantId) return;
    setIsSavingPermissions(true);
    try {
      // Save the current grant map to the tenant via PUT /tenants/:id, then
      // re-sync from the server's returned permission.permissions. Always-on
      // modules (Dashboard) are forced granted so they can never be saved off.
      const record = await updateSubTenantPermissions(tenantId, withLockedGrants(grants));
      setGrants(withLockedGrants(grantMapFromRecord(record)));
      setPermissionsSaved(true);
      appToast.success('Permissions saved');
      setTimeout(() => setPermissionsSaved(false), 2500);
    } catch (err: any) {
      appToast.error(err?.message || 'Failed to save permissions');
    } finally {
      setIsSavingPermissions(false);
    }
  };

  // Country → reset city and fetch that country's cities.
  const handleBusinessCountryChange = async (nextCountry: string) => {
    setBusiness((b) => ({ ...b, country: nextCountry, city: '' }));
    setBusinessCities([]);
    setBusinessCitiesError(false);
    if (!nextCountry) return;
    setBusinessCitiesLoading(true);
    try {
      setBusinessCities(await getCitiesForCountry(nextCountry));
    } catch {
      setBusinessCitiesError(true);
    } finally {
      setBusinessCitiesLoading(false);
    }
  };

  const handleBusinessLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowed.includes(file.type)) {
      appToast.error('Please choose an image (JPG, PNG, GIF, WebP or SVG).');
      return;
    }
    if (file.size > 1024 * 1024) {
      appToast.error(`Logo is ${Math.round(file.size / 1024)}KB — max is 1MB.`);
      return;
    }
    setLogoUploading(true);
    try {
      const res = await agentAPI.uploadLogo(file);
      const url = res?.logo_url || res?.url || res?.data?.logo_url || res?.data?.url || res?.data?.data?.logo_url;
      if (!url) throw new Error('Upload succeeded but no URL was returned.');
      setBusiness((b) => ({ ...b, logo: url }));
      appToast.success('Logo uploaded');
    } catch (err: any) {
      appToast.error(err?.message || 'Failed to upload logo');
    } finally {
      setLogoUploading(false);
    }
  };

  // Save the sub-tenant's business profile + plan via PUT /tenants/:id.
  const handleSaveBusiness = async () => {
    if (!tenant) return;
    setIsSavingBusiness(true);
    try {
      const updated = await updateSubTenant(tenant.id, {
        businessName: business.businessName.trim() || undefined,
        industry: business.industry || undefined,
        phone: business.phone.trim() || undefined,
        website: business.website.trim() || undefined,
        logo: business.logo.trim() || undefined,
        address: business.address.trim() || undefined,
        country: business.country.trim() || undefined,
        city: business.city.trim() || undefined,
        state: business.state.trim() || undefined,
        zip: business.zip.trim() || undefined,
        description: business.description.trim() || undefined,
        maxEmployees: business.maxEmployees === '' ? undefined : Number(business.maxEmployees),
      });
      setTenant(toTenant(updated));
      appToast.success('Business profile saved');
    } catch (err: any) {
      appToast.error(err?.message || 'Failed to save business profile');
    } finally {
      setIsSavingBusiness(false);
    }
  };

  // Active → deactivate routes through the Remove confirm (soft-delete via DELETE).
  // Inactive → reactivate is a best-effort PUT { isActive: true }.
  const handleToggleStatus = async () => {
    if (!tenant) return;
    if (tenant.status !== 'suspended') {
      setShowDeleteConfirm(true);
      return;
    }
    setIsTogglingStatus(true);
    try {
      const updated = await reactivateSubTenant(tenant.id);
      setTenant(toTenant(updated));
      appToast.success(`${tenant.name} reactivated`);
    } catch (err: any) {
      appToast.error(err?.message || 'Failed to reactivate');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!tenant) return;
    setIsDeleting(true);
    try {
      await deleteSubTenant(tenant.id);
      // Soft-delete: reflect the deactivated state instead of leaving the page.
      setTenant((prev) => (prev ? { ...prev, status: 'suspended' } : prev));
      setShowDeleteConfirm(false);
      appToast.success(`${tenant.name} deactivated`);
    } catch (err: any) {
      appToast.error(err?.message || 'Failed to deactivate sub-tenant');
    } finally {
      setIsDeleting(false);
    }
  };

  const grantedCount = useMemo(() => Object.values(grants).filter(Boolean).length, [grants]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-slate-300 dark:border-slate-600 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate('/sub-tenants')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> All Sub Tenants
        </button>
        <GlassCard className="p-8 text-center">
          <Building2 className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
            {loadError || "This sub-tenant couldn't be found."}
          </p>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white transition-colors"
          >
            Try again
          </button>
        </GlassCard>
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
          {tenant.branding?.logoUrl ? (
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shadow-sm flex-shrink-0">
              <img src={tenant.branding.logoUrl} alt={`${tenant.name} logo`} className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 dark:from-slate-500 dark:to-slate-700 flex items-center justify-center shadow-sm flex-shrink-0">
              <Building2 className="w-6 h-6 text-white" />
            </div>
          )}
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
            onClick={handleToggleStatus}
            disabled={isTogglingStatus}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors disabled:opacity-50 ${
              tenant.status === 'suspended'
                ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80'
                : 'bg-white dark:bg-slate-800 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20'
            }`}
          >
            {tenant.status === 'suspended' ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            {tenant.status === 'suspended' ? 'Reactivate' : 'Deactivate'}
          </button>
          <button
            type="button"
            onClick={() => setTab('settings')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-colors"
          >
            <SettingsIcon className="w-3.5 h-3.5" /> Settings
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
                <p className="text-xs text-slate-500 dark:text-slate-400">Billing</p>
                <p className="font-medium text-slate-800 dark:text-white">
                  {tenant.billing.mode === 'CENTRAL' ? 'Billed to you' : 'Pass-through'}
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {tab === 'settings' && (
        <div className="space-y-3">
          {/* Business Profile — editable */}
          <GlassCard className="p-4 sm:p-5 space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Business Profile</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Update {tenant.name}'s business details.</p>
            </div>

            {/* Logo */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Logo</label>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {business.logo ? (
                    <img src={business.logo} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <label className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 cursor-pointer transition-colors ${logoUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    {logoUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    {logoUploading ? 'Uploading…' : business.logo ? 'Replace' : 'Upload logo'}
                    <input type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml" className="hidden" onChange={handleBusinessLogoFile} disabled={logoUploading} />
                  </label>
                  {business.logo && !logoUploading && (
                    <button type="button" onClick={() => setBusiness((b) => ({ ...b, logo: '' }))} className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
                      <X className="w-3.5 h-3.5" /> Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"><Building2 className="w-3 h-3 text-slate-400" /> Business Name</label>
                <input type="text" value={business.businessName} onChange={(e) => setBusiness({ ...business, businessName: e.target.value })} placeholder="e.g. Northwind Dental Clinic" className={ST_INPUT} />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"><Briefcase className="w-3 h-3 text-slate-400" /> Industry</label>
                <SearchableSelect options={INDUSTRY_OPTIONS} value={business.industry} onChange={(v) => setBusiness({ ...business, industry: v })} placeholder="Select industry…" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"><Phone className="w-3 h-3 text-slate-400" /> Phone</label>
                <input type="tel" value={business.phone} onChange={(e) => setBusiness({ ...business, phone: e.target.value })} placeholder="+1 (555) 000-0000" className={ST_INPUT} />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"><Globe className="w-3 h-3 text-slate-400" /> Website</label>
                <input type="text" value={business.website} onChange={(e) => setBusiness({ ...business, website: e.target.value })} placeholder="theirbusiness.com" className={ST_INPUT} />
              </div>
              <div className="sm:col-span-2">
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"><MapPin className="w-3 h-3 text-slate-400" /> Street Address</label>
                <input type="text" value={business.address} onChange={(e) => setBusiness({ ...business, address: e.target.value })} placeholder="123 Main St, Suite 100" className={ST_INPUT} />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"><Globe className="w-3 h-3 text-slate-400" /> Country</label>
                <SearchableSelect options={COUNTRY_OPTIONS} value={business.country} onChange={handleBusinessCountryChange} placeholder="Select country…" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"><MapPin className="w-3 h-3 text-slate-400" /> City</label>
                {!business.country ? (
                  <div className={`${ST_INPUT} text-slate-400 dark:text-slate-500 flex items-center`}>Select a country first</div>
                ) : businessCitiesLoading ? (
                  <div className={`${ST_INPUT} text-slate-400 dark:text-slate-500 flex items-center gap-2`}><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading cities…</div>
                ) : businessCitiesError || businessCities.length === 0 ? (
                  <input type="text" value={business.city} onChange={(e) => setBusiness({ ...business, city: e.target.value })} placeholder="Type your city" className={ST_INPUT} />
                ) : (
                  <SearchableSelect options={businessCities.map((c) => ({ value: c, label: c }))} value={business.city} onChange={(v) => setBusiness({ ...business, city: v })} placeholder="Select city…" />
                )}
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"><MapPin className="w-3 h-3 text-slate-400" /> State / Province</label>
                <input type="text" value={business.state} onChange={(e) => setBusiness({ ...business, state: e.target.value })} placeholder="e.g. California" className={ST_INPUT} />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"><MapPin className="w-3 h-3 text-slate-400" /> ZIP / Postal Code</label>
                <input type="text" value={business.zip} onChange={(e) => setBusiness({ ...business, zip: e.target.value })} placeholder="e.g. 94107" className={ST_INPUT} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Description</label>
                <textarea value={business.description} onChange={(e) => setBusiness({ ...business, description: e.target.value })} placeholder="A short description of this business…" rows={3} className={`${ST_INPUT} resize-none`} />
              </div>
            </div>
          </GlassCard>

          {/* Plan & Usage */}
          <GlassCard className="p-4 sm:p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Plan & Usage</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Set limits and review current usage.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"><Users className="w-3 h-3 text-slate-400" /> Max Employees</label>
                <input type="number" min={1} value={String(business.maxEmployees)} onChange={(e) => setBusiness({ ...business, maxEmployees: e.target.value })} placeholder="Unlimited" className={ST_INPUT} />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              {[
                { label: 'Active Employees', value: tenant.usage.activeAgents, icon: Bot },
                { label: 'Calls This Month', value: tenant.usage.callsThisMonth, icon: Phone },
                { label: 'Success Rate', value: `${tenant.usage.successRate}%`, icon: TrendingUp },
                { label: 'Team Members', value: tenant.usage.activeUsers, icon: Users },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 p-3">
                  <div className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center mb-2">
                    <stat.icon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  </div>
                  <p className="text-base font-bold text-slate-800 dark:text-white leading-tight">{stat.value}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          <div className="flex sm:justify-end">
            <button
              type="button"
              onClick={handleSaveBusiness}
              disabled={isSavingBusiness || logoUploading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-colors disabled:opacity-50"
            >
              {isSavingBusiness ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSavingBusiness ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
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
          <PermissionMatrixEditor grants={grants} onChange={setGrants} />
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

      {tab === 'analytics' && <Analytics subTenantId={tenant.id} />}

      {tab === 'call-setup' && <CallSetup subTenantId={tenant.id} />}

      <ModalOverlay open={showDeleteConfirm} onClose={isDeleting ? undefined : () => setShowDeleteConfirm(false)} closeOnBackdrop={!isDeleting} panelClassName="max-w-md">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden">
          <div className="p-5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-1">Deactivate {tenant.name}?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              This sub-tenant will be deactivated and lose access. This is a soft-delete — their data is retained and you can reactivate them anytime.
            </p>
          </div>
          <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-700 flex gap-2.5">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {isDeleting ? 'Deactivating…' : 'Deactivate'}
            </button>
          </div>
        </div>
      </ModalOverlay>
    </div>
  );
};

export default SubTenantDetail;
