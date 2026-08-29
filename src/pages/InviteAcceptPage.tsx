import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Building2, Loader2, AlertTriangle, Check, Eye, EyeOff } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import Logo from '../resources/images/ShivaiLogo.svg';
import { tenantAPI } from '../services/tenantAPI';
import type { TenantInvite } from '../permissions/types';

/**
 * Public, pre-auth page an invited sub-tenant user lands on (spec §9
 * GET/POST /invites/:token, §4.1). No ProtectedRoute — anyone with the link
 * can view it, but accepting requires filling in their name/password here.
 */
const InviteAcceptPage = () => {
  const { slug, token } = useParams<{ slug: string; token: string }>();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<TenantInvite | null>(null);
  const [tenantName, setTenantName] = useState('');
  const [isResolving, setIsResolving] = useState(true);
  const [resolveError, setResolveError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!slug || !token) {
      setResolveError('This invite link is missing information and can\'t be opened.');
      setIsResolving(false);
      return;
    }
    tenantAPI
      .resolveInvite(slug, token)
      .then(({ invite, tenantName }) => {
        setInvite(invite);
        setTenantName(tenantName);
      })
      .catch((err) => setResolveError(err?.message || 'This invite link is invalid.'))
      .finally(() => setIsResolving(false));
  }, [slug, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setFormError('Enter your full name.');
      return;
    }
    if (password.length < 8) {
      setFormError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords don't match.");
      return;
    }
    setFormError(null);
    setIsSubmitting(true);
    try {
      await tenantAPI.acceptInvite(slug!, token!, { fullName: fullName.trim(), password });
      setAccepted(true);
      setTimeout(() => navigate('/landing'), 2500);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to accept the invite. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <img src={Logo} alt="ShivAI" className="h-8 w-auto dark:invert" />
        </div>

        <GlassCard className="p-6">
          {isResolving ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 text-violet-500 animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Checking your invite…</p>
            </div>
          ) : resolveError ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-xl border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6 text-rose-500" />
              </div>
              <h2 className="text-base font-semibold text-slate-800 dark:text-white mb-1">Invite not valid</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{resolveError}</p>
            </div>
          ) : accepted ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-emerald-500" />
              </div>
              <h2 className="text-base font-semibold text-slate-800 dark:text-white mb-1">You're all set</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Redirecting you to sign in…</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-800 dark:text-white">Join {tenantName}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Invited as <span className="font-medium">{invite?.email}</span>
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {formError && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-xs text-red-700 dark:text-red-300">{formError}</p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Full Name</label>
                  <input
                    autoFocus
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-violet-500/40 text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full px-3 py-2 pr-10 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-violet-500/40 text-slate-800 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Confirm Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-violet-500/40 text-slate-800 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating your account…' : 'Accept & Create Account'}
                </button>
              </form>
            </>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

export default InviteAcceptPage;
