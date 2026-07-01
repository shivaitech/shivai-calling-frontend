import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, LogOut, Smartphone } from "lucide-react";
import { authAPI } from "../services/authAPI";
import DoctorPublicCalendar from "../ClientDashboard/apps/AppointmentCRM/DoctorPublicCalendar";
import DoctorLiveCalendar from "../ClientDashboard/apps/AppointmentCRM/DoctorLiveCalendar";
import type { DoctorCalendarShare } from "../ClientDashboard/apps/AppointmentCRM/doctorCalendarShareStore";
import {
  clearDoctorSession,
  clearTenantJwtAuth,
  getShareByToken,
  hasDoctorJwtSession,
  hasDoctorSession,
  refreshShareSnapshot,
  setDoctorJwtSession,
  setDoctorSession,
  validateDoctorLogin,
} from "../ClientDashboard/apps/AppointmentCRM/doctorCalendarShareStore";
import { getStaffById } from "../ClientDashboard/apps/AppointmentCRM/staffStore";
import {
  enrichShareWithCalendarDay,
  fetchDoctorShareFromServer,
  fetchDoctorShareWithJwt,
  validateDoctorLoginViaApi,
} from "../ClientDashboard/apps/AppointmentCRM/doctorCalendarShareAPI";
import { toIsoDate } from "../ClientDashboard/apps/AppointmentCRM/availabilityStore";

function todayIso(): string {
  return toIsoDate(new Date());
}

function TenantLoginForm({
  email,
  password,
  error,
  submitting,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  compact,
}: {
  email: string;
  password: string;
  error: string | null;
  submitting: boolean;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  compact?: boolean;
}) {
  return (
    <form onSubmit={onSubmit} className={compact ? "space-y-3" : "space-y-3 mt-4"}>
      {!compact && (
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
          Sign in with your ShivAI clinic account to open this calendar.
        </p>
      )}
      <div>
        <label className="text-xs font-medium text-slate-500">ShivAI email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
          autoComplete="username"
          required
        />
      </div>
      <div>
        <label className="text-xs font-medium text-slate-500">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
          autoComplete="current-password"
          required
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full py-2.5 rounded-xl text-sm font-medium bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        Sign in with ShivAI account
      </button>
    </form>
  );
}

export default function DoctorCalendarPublicPage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [share, setShare] = useState<DoctorCalendarShare | null>(null);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [useJwtAuth, setUseJwtAuth] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantEmail, setTenantEmail] = useState("");
  const [tenantPassword, setTenantPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<{ prompt: () => Promise<void> } | null>(null);

  useEffect(() => {
    document.title = "My Appointment Calendar";
    const theme = document.querySelector('meta[name="theme-color"]') ?? document.createElement("meta");
    theme.setAttribute("name", "theme-color");
    theme.setAttribute("content", "#7c3aed");
    if (!theme.parentElement) document.head.appendChild(theme);
  }, [shareToken]);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as unknown as { prompt: () => Promise<void> });
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (!shareToken) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      let found = (await fetchDoctorShareFromServer(shareToken)) ?? getShareByToken(shareToken) ?? null;

      const shareSession = hasDoctorSession(shareToken);
      const jwtSession = hasDoctorJwtSession(shareToken);

      if (!found && jwtSession) {
        found = await fetchDoctorShareWithJwt(shareToken);
      }

      if (found && jwtSession) {
        found = await enrichShareWithCalendarDay(found, shareToken, todayIso(), { useJwt: true });
      }

      if (!cancelled) {
        const refreshed = found && shareToken && !jwtSession ? refreshShareSnapshot(shareToken) : null;
        const resolved = refreshed ?? found;
        setShare(resolved);
        setUseJwtAuth(jwtSession);
        setAuthed(shareSession || jwtSession);
        if (resolved?.doctorEmail) setEmail(resolved.doctorEmail);
        try {
          const user = localStorage.getItem("auth_user");
          if (user) setTenantEmail(JSON.parse(user).email ?? "");
        } catch {
          /* ignore */
        }
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [shareToken]);

  const completeTenantLogin = async (loginEmail: string, loginPassword: string) => {
    if (!shareToken) return false;
    const response = await authAPI.login({ email: loginEmail, password: loginPassword });
    localStorage.setItem("auth_tokens", JSON.stringify(response.tokens));
    localStorage.setItem("auth_user", JSON.stringify(response.user));

    let loaded = await fetchDoctorShareWithJwt(shareToken);
    if (!loaded) {
      setError("Signed in, but this calendar link could not be loaded. Check the URL or ask your admin.");
      return false;
    }
    loaded = await enrichShareWithCalendarDay(loaded, shareToken, todayIso(), { useJwt: true });
    setShare(loaded);
    setDoctorJwtSession(shareToken);
    setUseJwtAuth(true);
    setAuthed(true);
    return true;
  };

  const handleShareLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareToken) return;
    setSubmitting(true);
    setError(null);
    try {
      const remote = await validateDoctorLoginViaApi(shareToken, email, password);
      const local = remote ?? (await validateDoctorLogin(shareToken, email, password));
      if (!local) {
        setError("Invalid email or password");
        return;
      }
      const refreshed = refreshShareSnapshot(shareToken) ?? local;
      setShare(refreshed);
      setDoctorSession(shareToken);
      setUseJwtAuth(false);
      setAuthed(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTenantLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await completeTenantLogin(tenantEmail, tenantPassword);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    if (!shareToken) return;
    if (useJwtAuth) {
      clearTenantJwtAuth();
    }
    clearDoctorSession(shareToken);
    setAuthed(false);
    setUseJwtAuth(false);
    setPassword("");
    setTenantPassword("");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (!shareToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
        <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
          Missing calendar link. Open the full URL from your clinic invite.
        </p>
      </div>
    );
  }

  if (!authed) {
    if (!share) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-violet-50 dark:from-slate-900 dark:to-slate-800 p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="text-center mb-2">
              <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center mx-auto mb-3">
                <Smartphone className="w-6 h-6 text-violet-600" />
              </div>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Staff calendar</h1>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                This invite link is invalid or has expired. Sign in with your ShivAI clinic account to
                open the calendar for this link.
              </p>
            </div>
            <TenantLoginForm
              email={tenantEmail}
              password={tenantPassword}
              error={error}
              submitting={submitting}
              onEmailChange={setTenantEmail}
              onPasswordChange={setTenantPassword}
              onSubmit={handleTenantLogin}
              compact
            />
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-violet-50 dark:from-slate-900 dark:to-slate-800 p-4">
        <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center mx-auto mb-3">
              <Smartphone className="w-6 h-6 text-violet-600" />
            </div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">My calendar</h1>
            <p className="text-xs text-slate-500 mt-1">{share.companyName}</p>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-2">{share.staffName}</p>
          </div>
          <form onSubmit={handleShareLogin} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-500">Invite email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Invite password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full px-3 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                autoComplete="current-password"
                required
              />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Open calendar
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
              <span className="bg-white dark:bg-slate-900 px-2 text-slate-400">or</span>
            </div>
          </div>

          <TenantLoginForm
            email={tenantEmail}
            password={tenantPassword}
            error={error}
            submitting={submitting}
            onEmailChange={setTenantEmail}
            onPasswordChange={setTenantPassword}
            onSubmit={handleTenantLogin}
            compact
          />
        </div>
      </div>
    );
  }

  if (!share) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
        <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
          Calendar could not be loaded. Try signing in again.
        </p>
      </div>
    );
  }

  const canUseLiveCalendar = !useJwtAuth && Boolean(getStaffById(share.staffId));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">{share.companyName}</p>
          <p className="text-[10px] text-slate-500 truncate">{share.staffName}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {deferredPrompt && (
            <button
              type="button"
              onClick={() => deferredPrompt.prompt()}
              className="text-[10px] font-medium px-2 py-1 rounded-lg bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300"
            >
              Install app
            </button>
          )}
          <button type="button" onClick={handleLogout} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" title="Sign out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className={`p-3 sm:p-4 ${canUseLiveCalendar ? "max-w-6xl" : "max-w-lg"} mx-auto`}>
        <div className="mb-3 rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-200/70 dark:border-sky-800/50 px-3 py-2">
          <p className="text-[10px] text-sky-800 dark:text-sky-200 leading-relaxed flex gap-1.5">
            <Smartphone className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Your calendar only.</strong> Install on your phone for quick access — Safari → Share → Add to Home Screen, or Chrome → Install app.
            </span>
          </p>
        </div>
        {canUseLiveCalendar ? (
          <DoctorLiveCalendar staffId={share.staffId} />
        ) : (
          <DoctorPublicCalendar
            snapshot={share.snapshot}
            shareToken={shareToken}
            useJwtApi={useJwtAuth}
          />
        )}
      </main>
    </div>
  );
}
