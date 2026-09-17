import { useEffect, useState } from 'react';
import { UserPlus, X, Loader2, Copy, Check } from 'lucide-react';
import ModalOverlay from '../../components/ModalOverlay';
import { tenantAPI } from '../../services/tenantAPI';
import type { TenantInvite } from '../../permissions/types';

interface InviteLinkModalProps {
  open: boolean;
  tenantId: string;
  onClose: () => void;
}

const InviteLinkModal = ({ open, tenantId, onClose }: InviteLinkModalProps) => {
  const [email, setEmail] = useState('');
  const [invite, setInvite] = useState<TenantInvite | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setEmail('');
    setInvite(null);
    setCopied(false);
    setError(null);
  }, [open]);

  const handleGenerate = async () => {
    if (!email.trim()) {
      setError('Enter an email to invite.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await tenantAPI.createInvite(tenantId, email.trim());
      setInvite(result);
    } catch (err: any) {
      setError(err?.message || 'Failed to generate the invite link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = async () => {
    if (!invite) return;
    await navigator.clipboard.writeText(invite.inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ModalOverlay open={open} onClose={onClose} closeOnBackdrop panelClassName="max-w-md">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
              <UserPlus className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-slate-800 dark:text-white">Invite Member</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Generate a link to onboard someone into this sub-tenant.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex-shrink-0">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {!invite ? (
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Email Address</label>
              <input
                autoFocus
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@theirbusiness.com"
                className="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-violet-500/40 text-slate-800 dark:text-white"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <p className="text-xs text-emerald-700 dark:text-emerald-300">Invite ready to share with {invite.email}.</p>
              </div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">Invite Link</label>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={invite.inviteUrl}
                  className="flex-1 px-3 py-2 rounded-lg text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 truncate"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-500" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Expires {new Date(invite.expiresAt).toLocaleDateString()}.</p>
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors"
          >
            {invite ? 'Done' : 'Cancel'}
          </button>
          {!invite && (
            <button
              onClick={handleGenerate}
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {isSubmitting ? 'Generating…' : 'Generate Link'}
            </button>
          )}
        </div>
      </div>
    </ModalOverlay>
  );
};

export default InviteLinkModal;
