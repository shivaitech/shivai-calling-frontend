import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI, GoogleCalendarConnection } from '../../services/authAPI';
import GlassCard from '../../components/GlassCard';
import ModalOverlay from '../../components/ModalOverlay';
import GoogleCalendarEvents from './GoogleCalendarEvents';
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
  Mail,
  RefreshCw,
  Info,
} from 'lucide-react';

const GoogleCalendarIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <rect x="3" y="4" width="18" height="17" rx="2" fill="#fff" stroke="#4285F4" strokeWidth="1.5" />
    <rect x="3" y="4" width="18" height="5" rx="1" fill="#4285F4" />
    <rect x="7" y="12" width="4" height="4" fill="#34A853" />
    <rect x="13" y="12" width="4" height="4" fill="#FBBC05" />
  </svg>
);

const STATUS_META: Record<string, { label: string; className: string }> = {
  active: { label: 'Active', className: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20' },
  expired: { label: 'Expired', className: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20' },
  revoked: { label: 'Revoked', className: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20' },
};

// reason → { message, hint } per the OAuth integration doc's troubleshooting table.
const ERROR_REASON_META: Record<string, { message: string; hint: string }> = {
  access_denied: {
    message: 'You declined access in Google.',
    hint: 'Click Connect again and allow ShivAI to access your Calendar.',
  },
  missing_params: {
    message: 'The connection request was incomplete.',
    hint: 'Try connecting again.',
  },
  invalid_state: {
    message: 'The connection link expired or was tampered with.',
    hint: 'Connect links expire after 10 minutes — start a new one.',
  },
  calendar_scope_denied: {
    message: 'Email/profile access was granted, but not Calendar.',
    hint: 'Connect again and make sure to allow the Calendar permission.',
  },
  missing_refresh_token: {
    message: "Google didn't grant offline access.",
    hint: "This can happen after a disconnect. Remove ShivAI from your Google Account's third-party access page, then connect again.",
  },
  encryption_misconfigured: {
    message: 'A server configuration issue prevented the connection.',
    hint: 'This is on our end — please contact support.',
  },
  token_exchange_failed: {
    message: "Google couldn't verify the connection.",
    hint: 'This can happen if the page was refreshed mid-connect. Try connecting again.',
  },
  unknown: {
    message: 'Could not connect Google Calendar.',
    hint: 'Please try again.',
  },
};

const formatExpiry = (expiresAt: string | null): { label: string; urgent: boolean } | null => {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  if (ms <= 0) return { label: 'Token expired', urgent: true };
  const hours = Math.round(ms / (60 * 60 * 1000));
  if (hours < 1) return { label: 'Expires in under an hour', urgent: true };
  if (hours < 24) return { label: `Expires in ~${hours}h`, urgent: hours < 6 };
  const days = Math.round(hours / 24);
  return { label: `Expires in ~${days}d`, urgent: false };
};

const SCOPE_LABELS: Record<string, string> = {
  'https://www.googleapis.com/auth/calendar': 'Full calendar access (read/write events)',
  'https://www.googleapis.com/auth/calendar.readonly': 'View calendar events',
  'https://www.googleapis.com/auth/calendar.events': 'Manage calendar events',
  'https://www.googleapis.com/auth/userinfo.email': 'View your email address',
  openid: 'Verify your identity',
};

const GoogleCalendarManager = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [connection, setConnection] = useState<GoogleCalendarConnection | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMeta, setErrorMeta] = useState<{ message: string; hint: string } | null>(null);
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const refreshStatus = useCallback(() => {
    setLoading(true);
    authAPI.getGoogleCalendarStatus()
      .then(setConnection)
      .catch(() => setConnection(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // Handle ?google_calendar=connected / ?google_calendar=error return from the OAuth redirect
  useEffect(() => {
    const googleCalendar = params.get('google_calendar');
    if (!googleCalendar) return;

    if (googleCalendar === 'connected') {
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 6000);
      refreshStatus();
    } else {
      const reason = params.get('reason') || 'unknown';
      setErrorMeta(ERROR_REASON_META[reason] || ERROR_REASON_META.unknown);
      setTimeout(() => setErrorMeta(null), 12000);
    }
    setConnecting(false);

    params.delete('google_calendar');
    params.delete('reason');
    setParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const handleConnect = () => {
    setConnecting(true);
    authAPI.connectGoogleCalendar();
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await authAPI.disconnectGoogleCalendar();
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
  const expiryInfo = isConnected ? formatExpiry(connection?.expiresAt ?? null) : null;

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
              <GoogleCalendarIcon />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white leading-tight">Google Calendar</h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">Manage your Google Calendar connection for bookings and appointments</p>
            </div>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
          <p className="text-xs text-green-700 dark:text-green-300 font-medium flex-1">Google Calendar connected successfully.</p>
          <button onClick={() => setSuccessMsg(false)} className="text-green-500 hover:text-green-700 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {errorMeta && (
        <div className="flex items-start gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-red-700 dark:text-red-300 font-medium">{errorMeta.message}</p>
            <p className="text-[11px] text-red-600/80 dark:text-red-400/80 mt-0.5">{errorMeta.hint}</p>
          </div>
          <button onClick={() => setErrorMeta(null)} className="text-red-500 hover:text-red-700 transition-colors flex-shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Connection card — always pinned above the event tabs */}
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
                    <GoogleCalendarIcon />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-semibold text-slate-800 dark:text-white text-sm">Google Calendar</p>
                      {statusMeta && (
                        <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap ${statusMeta.className}`}>
                          {statusMeta.label}
                        </span>
                      )}
                      {expiryInfo && (
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                            expiryInfo.urgent
                              ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20'
                              : 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
                          }`}
                        >
                          <Clock className="w-2.5 h-2.5" /> {expiryInfo.label}
                        </span>
                      )}
                    </div>
                    {connection?.email && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{connection.email}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={refreshStatus}
                    disabled={loading}
                    title="Refresh status"
                    className="flex items-center justify-center p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => setDisconnectOpen(true)}
                    className="flex items-center justify-center gap-1.5 text-xs font-medium px-2.5 py-2 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Unlink className="w-3.5 h-3.5" /> Disconnect
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-2 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500 leading-none">Account</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
                      {connection?.email || '—'}
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
              </div>

              {!!connection?.scopes?.length && (
                <details className="rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-2 group">
                  <summary className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 cursor-pointer select-none">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                    Permissions granted ({connection.scopes.length})
                  </summary>
                  <ul className="mt-2 space-y-1 pl-5">
                    {connection.scopes.map((scope) => (
                      <li key={scope} className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                        <Check className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{SCOPE_LABELS[scope] || scope}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 gap-2.5 text-center">
              <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                <GoogleCalendarIcon />
              </div>
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-300 text-sm">Not connected</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 max-w-xs">
                  Connect your Google Calendar to sync bookings and appointments automatically.
                </p>
              </div>

              <button
                onClick={handleConnect}
                disabled={connecting}
                className="common-button-bg flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                {connecting ? 'Redirecting to Google…' : 'Connect Google Calendar'}
              </button>
            </div>
          )}
        </div>
      </GlassCard>

      {isConnected && <GoogleCalendarEvents />}

      {!isConnected && !loading && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Once connected, you'll be able to view, create, and manage this calendar's events right here.
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
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Disconnect Google Calendar?</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  ShivAI will no longer be able to access your Google Calendar. You can reconnect at any time.
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

export default GoogleCalendarManager;
