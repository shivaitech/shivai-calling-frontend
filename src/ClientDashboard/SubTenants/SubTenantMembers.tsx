import { useEffect, useState } from 'react';
import { UserPlus, Mail, Clock, RotateCw, Trash2, Crown, X, AlertTriangle } from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import ModalOverlay from '../../components/ModalOverlay';
import SearchableSelect from '../../components/SearchableSelect';
import { tenantAPI } from '../../services/tenantAPI';
import type { TenantMember, TenantMemberRole } from '../../permissions/types';

interface SubTenantMembersProps {
  tenantId: string;
  onInvite: () => void;
  /** Bumped by the parent whenever an invite is generated elsewhere, to
   * trigger a refetch without prop-drilling the member list itself. */
  refreshToken: number;
}

const ROLE_OPTIONS: Array<{ value: TenantMemberRole; label: string }> = [
  { value: 'SUBTENANT_OWNER', label: 'Owner' },
  { value: 'SUBTENANT_MEMBER', label: 'Member' },
];

function formatLastActive(lastActive: string | null): string {
  if (!lastActive) return 'Never logged in';
  const diffMs = Date.now() - new Date(lastActive).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

const SubTenantMembers = ({ tenantId, onInvite, refreshToken }: SubTenantMembersProps) => {
  const [members, setMembers] = useState<TenantMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyMemberId, setBusyMemberId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<TenantMember | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const load = () => {
    setIsLoading(true);
    tenantAPI
      .listMembers(tenantId)
      .then(setMembers)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, refreshToken]);

  const handleRoleChange = async (member: TenantMember, role: TenantMemberRole) => {
    setBusyMemberId(member.id);
    try {
      const updated = await tenantAPI.updateMemberRole(tenantId, member.id, role);
      setMembers((prev) => prev.map((m) => (m.id === member.id ? updated : m)));
    } finally {
      setBusyMemberId(null);
    }
  };

  const handleResend = async (member: TenantMember) => {
    setBusyMemberId(member.id);
    try {
      await tenantAPI.resendInvite(tenantId, member.id);
      load();
    } finally {
      setBusyMemberId(null);
    }
  };

  const handleConfirmRemove = async () => {
    if (!removeTarget) return;
    setIsRemoving(true);
    try {
      await tenantAPI.removeMember(tenantId, removeTarget.id);
      setMembers((prev) => prev.filter((m) => m.id !== removeTarget.id));
      setRemoveTarget(null);
    } finally {
      setIsRemoving(false);
    }
  };

  const ownerCount = members.filter((m) => m.role === 'SUBTENANT_OWNER').length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {members.length} member{members.length === 1 ? '' : 's'} in this sub-tenant.
        </p>
        <button
          type="button"
          onClick={onInvite}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" /> Invite a Member
        </button>
      </div>

      <GlassCard className="p-2 sm:p-3">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-slate-300 dark:border-slate-600 border-t-violet-600 rounded-full animate-spin mx-auto" />
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-8">
            <UserPlus className="w-7 h-7 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">No members yet — invite the first one.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {members.map((member) => {
              const isLastOwner = member.role === 'SUBTENANT_OWNER' && ownerCount === 1;
              const busy = busyMemberId === member.id;
              return (
                <div
                  key={member.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                    {member.role === 'SUBTENANT_OWNER' ? (
                      <Crown className="w-3.5 h-3.5 text-amber-500" />
                    ) : (
                      <Mail className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{member.name}</p>
                      {member.status === 'invited' && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 whitespace-nowrap">
                          Invite Pending
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{member.email}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatLastActive(member.lastActive)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className="w-32">
                      <SearchableSelect
                        options={ROLE_OPTIONS}
                        value={member.role}
                        onChange={(v) => handleRoleChange(member, v as TenantMemberRole)}
                        disabled={busy || isLastOwner}
                      />
                    </div>
                    {member.status === 'invited' && (
                      <button
                        type="button"
                        onClick={() => handleResend(member)}
                        disabled={busy}
                        title="Resend invite"
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                      >
                        <RotateCw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setRemoveTarget(member)}
                      disabled={busy || isLastOwner}
                      title={isLastOwner ? "Can't remove the only owner" : 'Remove member'}
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:border-rose-200 dark:hover:border-rose-800 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>

      <ModalOverlay open={!!removeTarget} onClose={() => (isRemoving ? undefined : setRemoveTarget(null))} closeOnBackdrop={!isRemoving} panelClassName="max-w-sm">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-slate-800 dark:text-white">Remove Member</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {removeTarget?.name} will lose access to this sub-tenant immediately.
                </p>
              </div>
            </div>
            <button onClick={() => setRemoveTarget(null)} disabled={isRemoving} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex-shrink-0 disabled:opacity-40">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex gap-2.5">
            <button
              onClick={() => setRemoveTarget(null)}
              disabled={isRemoving}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmRemove}
              disabled={isRemoving}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white transition-colors disabled:opacity-50"
            >
              {isRemoving ? 'Removing…' : 'Remove'}
            </button>
          </div>
        </div>
      </ModalOverlay>
    </div>
  );
};

export default SubTenantMembers;
