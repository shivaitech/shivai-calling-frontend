import { useEffect, useMemo, useState } from 'react';
import {
  UsersRound,
  Plus,
  Search,
  Loader2,
  MoreVertical,
  Pencil,
  Pause,
  Play,
  Trash2,
  ShieldCheck,
  Mail,
  Clock,
  Building2,
} from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import ModalOverlay from '../../components/ModalOverlay';
import appToast from '../../components/AppToast';
import { useAuth } from '../../contexts/AuthContext';
import { staffAPI, countGrants, type StaffMember, type StaffStatus } from '../../services/staffAPI';
import StaffEditorModal from './StaffEditorModal';

const statusBadge = (status: StaffStatus) => {
  if (status === 'active') return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
  if (status === 'invited') return 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
  return 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700';
};

const fmtLastActive = (iso: string | null): string => {
  if (!iso) return 'Never signed in';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
};

const Staff = () => {
  const { user } = useAuth();
  const tenantId = String(user?.tenantId || user?.id || 'me');

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | StaffStatus>('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [removeTarget, setRemoveTarget] = useState<StaffMember | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const load = () => {
    setLoading(true);
    staffAPI
      .list(tenantId)
      .then(setStaff)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return staff
      .filter((s) => (statusFilter === 'all' ? true : s.status === statusFilter))
      .filter((s) => (q ? `${s.name} ${s.email}`.toLowerCase().includes(q) : true));
  }, [staff, search, statusFilter]);

  const openCreate = () => {
    setEditing(null);
    setShowEditor(true);
  };
  const openEdit = (s: StaffMember) => {
    setOpenMenuId(null);
    setEditing(s);
    setShowEditor(true);
  };

  const toggleStatus = async (s: StaffMember) => {
    setOpenMenuId(null);
    setBusyId(s.id);
    try {
      const next: StaffStatus = s.status === 'suspended' ? 'active' : 'suspended';
      const updated = await staffAPI.setStatus(s.id, next);
      setStaff((prev) => prev.map((x) => (x.id === s.id ? updated : x)));
      appToast.success(next === 'suspended' ? `${s.name} suspended` : `${s.name} reactivated`);
    } catch (err: any) {
      appToast.error(err?.message || 'Failed to update status');
    } finally {
      setBusyId(null);
    }
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;
    setIsRemoving(true);
    try {
      await staffAPI.remove(removeTarget.id);
      setStaff((prev) => prev.filter((x) => x.id !== removeTarget.id));
      appToast.success(`${removeTarget.name} removed`);
      setRemoveTarget(null);
    } catch (err: any) {
      appToast.error(err?.message || 'Failed to remove staff');
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="space-y-4" onClick={() => openMenuId && setOpenMenuId(null)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-sm flex-shrink-0">
            <UsersRound className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">Staff</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Hire people and give each access to only the features they need.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Staff
        </button>
      </div>

      {/* Filters */}
      <GlassCard className="p-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search staff by name or email…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-violet-500/40 text-slate-800 dark:text-white"
            />
          </div>
          <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {(['all', 'active', 'invited', 'suspended'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-2.5 text-xs font-medium capitalize transition-colors ${
                  statusFilter === s
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <UsersRound className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-1 font-medium">No staff yet</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Add your first team member and choose what they can access.
          </p>
          <button onClick={openCreate} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-colors">
            <Plus className="w-4 h-4" /> Add Staff
          </button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map((s) => (
            <GlassCard key={s.id} className="p-4 relative">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  {(s.name || '?').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{s.name}</p>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${statusBadge(s.status)}`}>
                      {s.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5">
                    <Mail className="w-3 h-3" /> {s.email}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                    <span className="inline-flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> {s.roleName || 'Staff'}</span>
                    <span>· {countGrants(s.grants)} features</span>
                    {s.managedSubTenantIds && s.managedSubTenantIds.length > 0 && (
                      <span className="inline-flex items-center gap-1"><Building2 className="w-3 h-3" /> {s.managedSubTenantIds.length} sub-tenants</span>
                    )}
                    <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {fmtLastActive(s.lastActive)}</span>
                  </div>
                </div>

                {/* Row menu */}
                <div className="relative flex-shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === s.id ? null : s.id);
                    }}
                    disabled={busyId === s.id}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                  >
                    {busyId === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreVertical className="w-4 h-4" />}
                  </button>
                  {openMenuId === s.id && (
                    <div className="absolute right-0 top-9 z-20 w-44 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg py-1" onClick={(e) => e.stopPropagation()}>
                      <button type="button" onClick={() => openEdit(s)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60">
                        <Pencil className="w-3.5 h-3.5" /> Edit access
                      </button>
                      <button type="button" onClick={() => toggleStatus(s)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60">
                        {s.status === 'suspended' ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                        {s.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                      </button>
                      <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
                      <button type="button" onClick={() => { setOpenMenuId(null); setRemoveTarget(s); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20">
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <StaffEditorModal
        open={showEditor}
        tenantId={tenantId}
        editing={editing}
        onClose={() => setShowEditor(false)}
        onSaved={() => {
          setShowEditor(false);
          load();
        }}
      />

      {/* Remove confirm */}
      <ModalOverlay open={!!removeTarget} onClose={isRemoving ? undefined : () => setRemoveTarget(null)} closeOnBackdrop={!isRemoving} panelClassName="max-w-sm">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden">
          <div className="p-5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-1">Remove staff member?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              <span className="font-medium text-slate-700 dark:text-slate-300">{removeTarget?.name}</span> will lose all access immediately.
            </p>
          </div>
          <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-700 flex gap-2.5">
            <button onClick={() => setRemoveTarget(null)} disabled={isRemoving} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 disabled:opacity-50">
              Cancel
            </button>
            <button onClick={confirmRemove} disabled={isRemoving} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center gap-2 disabled:opacity-50">
              {isRemoving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {isRemoving ? 'Removing…' : 'Remove'}
            </button>
          </div>
        </div>
      </ModalOverlay>
    </div>
  );
};

export default Staff;
