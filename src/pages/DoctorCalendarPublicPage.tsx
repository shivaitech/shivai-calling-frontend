import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, LogOut, Smartphone } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import AuthModel from "../components/AuthModel";
import DoctorLiveCalendar from "../ClientDashboard/apps/AppointmentCRM/DoctorLiveCalendar";
import { loadStaffCalendarById } from "../ClientDashboard/apps/AppointmentCRM/staffCalendarLoader";
import { staffDisplayName, type StaffMember } from "../ClientDashboard/apps/AppointmentCRM/staffStore";
import { readSetup } from "../ClientDashboard/apps/AppointmentCRM/setupStore";
import { getStaffCalendarPath, saveDoctorPWAStaffId } from "../utils/doctorPWA";

type PagePhase = "checking" | "login" | "ready" | "error";

function StaffCalendarContent({
  staffId,
  onLogout,
  deferredPrompt,
}: {
  staffId: string;
  onLogout: () => void;
  deferredPrompt: { prompt: () => Promise<void> } | null;
}) {
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const setup = readSetup();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      setStaff(null);
      try {
        const loaded = await loadStaffCalendarById(staffId);
        if (!cancelled) {
          setStaff(loaded);
          saveDoctorPWAStaffId(loaded.id);
        }
      } catch {
        if (!cancelled) {
          setLoadError("Staff calendar not found. Check the link or ask your clinic admin.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [staffId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading calendar…</p>
      </div>
    );
  }

  if (loadError || !staff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
        <div className="max-w-sm text-center space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-400">{loadError}</p>
          <button
            type="button"
            onClick={onLogout}
            className="text-sm font-medium text-violet-600 hover:underline"
          >
            Sign in with a different account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">
            {setup.companyName || "Calendar"}
          </p>
          <p className="text-[10px] text-slate-500 truncate">{staffDisplayName(staff)}</p>
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
          <button
            type="button"
            onClick={onLogout}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="p-3 sm:p-4 max-w-6xl mx-auto">
        <div className="mb-3 rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-200/70 dark:border-sky-800/50 px-3 py-2">
          <p className="text-[10px] text-sky-800 dark:text-sky-200 leading-relaxed flex gap-1.5">
            <Smartphone className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Your calendar only.</strong> Add to your home screen for quick access.
            </span>
          </p>
        </div>
        <DoctorLiveCalendar staffId={staff.id} />
      </main>
    </div>
  );
}

export default function DoctorCalendarPublicPage() {
  const { staffId } = useParams<{ staffId: string }>();
  const {
    isAuthenticated,
    isLoading: authLoading,
    login,
    logout,
    error,
    clearError,
    getGoogleAuthUrl,
    isLoading,
  } = useAuth();

  const [phase, setPhase] = useState<PagePhase>("checking");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });
  const [pageError, setPageError] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<{ prompt: () => Promise<void> } | null>(null);

  useEffect(() => {
    document.title = "Staff Calendar";
    const theme = document.querySelector('meta[name="theme-color"]') ?? document.createElement("meta");
    theme.setAttribute("name", "theme-color");
    theme.setAttribute("content", "#7c3aed");
    if (!theme.parentElement) document.head.appendChild(theme);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as unknown as { prompt: () => Promise<void> });
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (staffId) {
      sessionStorage.setItem("staff_calendar_return", getStaffCalendarPath(staffId));
    }
  }, [staffId]);

  useEffect(() => {
    if (authLoading) return;

    if (!staffId) {
      setPhase("error");
      setPageError("Invalid calendar link.");
      return;
    }

    if (!isAuthenticated) {
      setPhase("login");
      setShowAuthModal(true);
      return;
    }

    setPhase("ready");
  }, [authLoading, isAuthenticated, staffId]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setFieldErrors({});
    setPageError(null);

    try {
      const response = await login(formData.email, formData.password);
      localStorage.setItem("auth_tokens", JSON.stringify(response.tokens));
      localStorage.setItem("auth_user", JSON.stringify(response.user));
      setShowAuthModal(false);
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { status?: number; data?: { errors?: { field: string; message: string }[] } };
      };
      if (axiosErr.response?.status === 422 && axiosErr.response.data?.errors) {
        const next: Record<string, string> = {};
        axiosErr.response.data.errors.forEach((item) => {
          next[item.field] = item.message;
        });
        setFieldErrors(next);
      }
      throw err;
    }
  };

  const handleSocialAuth = async (provider: string) => {
    if (provider === "google") {
      const url = await getGoogleAuthUrl();
      window.location.href = url;
    }
  };

  const handleLogout = () => {
    logout();
    sessionStorage.removeItem("staff_calendar_return");
    setShowAuthModal(true);
    setPhase("login");
    setPageError(null);
  };

  if (phase === "checking" || authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#F0F0F0] dark:bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        <p className="text-sm text-slate-500">Checking session…</p>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0F0F0] dark:bg-slate-900 p-6">
        <p className="text-sm text-slate-600 dark:text-slate-400 text-center">{pageError}</p>
      </div>
    );
  }

  if (phase === "login") {
    return (
      <div className="min-h-screen bg-[#F0F0F0] dark:bg-slate-900">
        {showAuthModal && (
          <AuthModel
            authMode="signin"
            setAuthMode={setAuthMode}
            error={pageError || error}
            closeModal={() => {}}
            handleAuth={handleAuth}
            handleSocialAuth={handleSocialAuth}
            formData={formData}
            setFormData={setFormData}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            isLoading={isLoading}
            fieldErrors={fieldErrors}
          />
        )}
      </div>
    );
  }

  if (!staffId) return null;

  return (
    <StaffCalendarContent
      staffId={staffId}
      onLogout={handleLogout}
      deferredPrompt={deferredPrompt}
    />
  );
}
