import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI, ZohoConnection, ZOHO_DATA_CENTERS } from '../../services/authAPI';
import GlassCard from '../../components/GlassCard';
import ModalOverlay from '../../components/ModalOverlay';
import ZohoCrmDashboard from './ZohoCrmDashboard';
import {
  ArrowLeft,
  Loader2,
  Check,
  X,
  Link2,
  Unlink,
  AlertTriangle,
  Trash2,
  ShieldCheck,
  Clock,
  Globe2,
  Users,
} from 'lucide-react';

const ZohoIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <rect x="2" y="6" width="20" height="12" rx="2" fill="#C8202F" />
    <path d="M7 9.5h4.5L7.3 14.5H12M13 9.5h4l-3.6 5" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const STATUS_META: Record<string, { label: string; className: string }> = {
  active: { label: 'Active', className: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20' },
  expired: { label: 'Expired', className: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20' },
  revoked: { label: 'Revoked', className: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20' },
};

const ERROR_REASON_LABELS: Record<string, string> = {
  access_denied: 'You declined access in Zoho.',
  missing_params: 'The connection request was incomplete.',
  invalid_state: 'The connection request expired. Please try again.',
  token_exchange_failed: 'Zoho could not verify the connection. Please try again.',
};

const ZohoManager = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [connection, setConnection] = useState<ZohoConnection | null>(null);
  const [dc, setDc] = useState('in');
  const [connecting, setConnecting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const refreshStatus = useCallback(() => {
    setLoading(true);
    authAPI.getZohoStatus()
      .then(setConnection)
      .catch(() => setConnection(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // Handle ?zoho=connected / ?zoho=error return from the OAuth redirect
  useEffect(() => {
    const zoho = params.get('zoho');
    if (!zoho) return;

    if (zoho === 'connected') {
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 6000);
      refreshStatus();
    } else {
      const reason = params.get('reason') || 'unknown';
      setErrorMsg(ERROR_REASON_LABELS[reason] || 'Could not connect Zoho CRM. Please try again.');
      setTimeout(() => setErrorMsg(''), 8000);
    }
    setConnecting(false);

    params.delete('zoho');
    params.delete('reason');
    setParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const handleConnect = () => {
    setConnecting(true);
    authAPI.connectZoho(dc).catch(() => {
      setConnecting(false);
      setErrorMsg('Could not start the Zoho connection. Please try again.');
      setTimeout(() => setErrorMsg(''), 8000);
    });
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await authAPI.disconnectZoho();
      setDisconnectOpen(false);
      refreshStatus();
    } catch {
      // keep modal open; user can retry
    } finally {
      setDisconnecting(false);
    }
  };

  const isConnected = !!connection?.connected;
  const statusMeta = connection?.status ? STATUS_META[connection.status] : null;

  return (
    <div className="space-y-3 w-full">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/settings#accounts')}
            className="common-button-bg2 flex items-center gap-1.5 px-3 py-2 rounded-xl flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Back</span>
          </button>

          <div className="hidden sm:block h-7 w-px bg-slate-200 dark:bg-slate-700 flex-shrink-0" />

          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
              <ZohoIcon />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white leading-tight">Zoho CRM</h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">Manage your Zoho CRM connection for outbound campaigns</p>
            </div>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
          <p className="text-xs text-green-700 dark:text-green-300 font-medium flex-1">Zoho CRM connected successfully.</p>
          <button onClick={() => setSuccessMsg(false)} className="text-green-500 hover:text-green-700 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-700 dark:text-red-300 font-medium flex-1">{errorMsg}</p>
          <button onClick={() => setErrorMsg('')} className="text-red-500 hover:text-red-700 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Connection card */}
      <GlassCard>
        <div className="p-3 sm:p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8 gap-2.5">
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              <span className="text-sm text-slate-500 dark:text-slate-400">Checking connection status…</span>
            </div>
          ) : isConnected ? (
            <div className="space-y-2.5">
              <div className="common-bg-icons rounded-lg border border-slate-200 dark:border-slate-700 p-3 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                    <ZohoIcon />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-semibold text-slate-800 dark:text-white text-sm">Zoho CRM</p>
                      {statusMeta && (
                        <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap ${statusMeta.className}`}>
                          {statusMeta.label}
                        </span>
                      )}
                    </div>
                    {connection?.apiDomain && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{connection.apiDomain}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setDisconnectOpen(true)}
                  className="flex items-center justify-center gap-1.5 text-xs font-medium px-2.5 py-2 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
                >
                  <Unlink className="w-3.5 h-3.5" /> Disconnect
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-2 flex items-center gap-2 col-span-2 sm:col-span-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500 leading-none">Scopes</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
                      {connection?.scopes?.length ? connection.scopes.join(', ') : '—'}
                    </p>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-2 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500 leading-none">Connected since</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {connection?.createdAt ? new Date(connection.createdAt).toLocaleDateString() : '—'}
                    </p>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-2 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500 leading-none">Last updated</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {connection?.updatedAt ? new Date(connection.updatedAt).toLocaleString() : '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-14 gap-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                <ZohoIcon />
              </div>
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-300 text-sm">Not connected</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
                  Connect your Zoho CRM account to sync leads and contacts for outbound campaigns.
                </p>
              </div>

              <div className="w-full max-w-xs text-left">
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  <Globe2 className="w-3.5 h-3.5" /> Zoho Data Center
                </label>
                <select
                  value={dc}
                  onChange={e => setDc(e.target.value)}
                  disabled={connecting}
                  className="w-full px-3 py-2 rounded-lg text-sm common-bg-icons border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500/40 text-slate-800 dark:text-white disabled:opacity-60"
                >
                  {ZOHO_DATA_CENTERS.map(item => (
                    <option key={item.id} value={item.id}>{item.label}</option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Choose the region your Zoho CRM account is hosted in.</p>
              </div>

              <button
                onClick={handleConnect}
                disabled={connecting}
                className="common-button-bg flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                {connecting ? 'Redirecting to Zoho…' : 'Connect Zoho CRM'}
              </button>
            </div>
          )}
        </div>
      </GlassCard>

      {isConnected && <ZohoCrmDashboard />}

      {!isConnected && !loading && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <Users className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Once connected, you'll see your Zoho Leads and Deals right here — no need to switch tabs.
          </p>
        </div>
      )}

      {/* Disconnect confirmation */}
      <ModalOverlay open={disconnectOpen} onClose={() => !disconnecting && setDisconnectOpen(false)} panelClassName="max-w-[420px]" closeOnBackdrop={!disconnecting}>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full border border-slate-200/80 dark:border-slate-700 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-red-500 via-red-400 to-orange-400" />
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200/80 dark:border-red-900/50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400" />
              </div>
              <div className="min-w-0 pt-0.5">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Disconnect Zoho CRM?</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  ShivAI will no longer be able to access your Zoho CRM account. You can reconnect at any time.
                </p>
              </div>
            </div>
          </div>
          <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex gap-2.5">
              <button
                onClick={() => setDisconnectOpen(false)}
                disabled={disconnecting}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {disconnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Disconnecting…
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" /> Disconnect
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </ModalOverlay>
    </div>
  );
};

export default ZohoManager;
