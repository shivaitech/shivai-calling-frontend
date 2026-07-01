import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { isAppointmentCrmApiConfigured } from "./api/client";
import { setAppointmentCrmApiMode } from "./api/apiMode";
import appointmentCrmAPI from "./api/index";
import { hydrateFromBootstrap, hydrateStaffBookingsSchedule } from "./api/hydrate";
import { apiId, mapStaff } from "./api/mappers";
import type { ApiAnalyticsOverview, ApiBootstrap } from "./api/types";
import { isSetupComplete, writeSetup } from "./setupStore";
import { readBranches } from "./branchesStore";

interface AppointmentCRMContextValue {
  loading: boolean;
  error: string | null;
  apiReady: boolean;
  bootstrap: ApiBootstrap | null;
  stats: ApiBootstrap["stats"] | null;
  analytics: ApiAnalyticsOverview | null;
  refresh: () => Promise<void>;
  reloadCalendarDay: (branchId: string, date: string) => Promise<void>;
}

const AppointmentCRMContext = createContext<AppointmentCRMContextValue | null>(null);

export function useAppointmentCRM() {
  const ctx = useContext(AppointmentCRMContext);
  if (!ctx) {
    return {
      loading: false,
      error: null,
      apiReady: false,
      bootstrap: null,
      stats: null,
      analytics: null,
      refresh: async () => {},
      reloadCalendarDay: async () => {},
    };
  }
  return ctx;
}

async function loadOrgData(bootstrap: ApiBootstrap) {
  hydrateFromBootstrap(bootstrap);
  const branchId =
    bootstrap.preferences?.activeBranchId ?? apiId(bootstrap.branches[0] ?? {});
  const [staffRaw, bookingsRaw, analytics] = await Promise.all([
    appointmentCrmAPI.fetchStaff(branchId ? { branchId, active: true } : { active: true }),
    appointmentCrmAPI.fetchBookings(branchId ? { branchId } : undefined),
    appointmentCrmAPI.fetchAnalyticsOverview(branchId).catch(() => null),
  ]);
  const branches = readBranches();
  await hydrateStaffBookingsSchedule({
    staff: staffRaw.map((s, i) => mapStaff(s, i)),
    bookings: bookingsRaw,
    branches,
  });
  return analytics;
}

export function AppointmentCRMProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(isAppointmentCrmApiConfigured());
  const [error, setError] = useState<string | null>(null);
  const [bootstrap, setBootstrap] = useState<ApiBootstrap | null>(null);
  const [analytics, setAnalytics] = useState<ApiAnalyticsOverview | null>(null);
  const apiReady = isAppointmentCrmApiConfigured();

  const refresh = useCallback(async () => {
    if (!apiReady) {
      setAppointmentCrmApiMode(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setAppointmentCrmApiMode(true);
      const data = await appointmentCrmAPI.fetchBootstrap();
      setBootstrap(data);
      if (data.setup?.setupComplete) {
        const overview = await loadOrgData(data);
        setAnalytics(overview);
      } else {
        writeSetup(
          {
            setupComplete: false,
            companyName: data.setup?.companyName ?? "",
            industryId: "clinic",
            branchMode: data.setup?.branchMode ?? "single",
            timezone: data.setup?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          { fromApi: true },
        );
      }
    } catch (e) {
      setAppointmentCrmApiMode(false);
      setError(e instanceof Error ? e.message : "Failed to load Appointment CRM");
    } finally {
      setLoading(false);
    }
  }, [apiReady]);

  const reloadCalendarDay = useCallback(async (branchId: string, date: string) => {
    if (!apiReady || !isSetupComplete()) return;
    const day = await appointmentCrmAPI.fetchCalendarDay({ branchId, date });
    const branches = readBranches();
    const branchName = branches.find((b) => b.id === branchId)?.name ?? "";
    const staff = (day.staff ?? []).map((s, i) => mapStaff(s, i));
    const bookings = (day.bookings ?? []).map((b) => mapBooking(b, { branchName }));
    await hydrateStaffBookingsSchedule({
      staff,
      bookings,
      branches,
      availabilities: day.availabilities,
      leaves: day.leaves,
      blocks: day.blocks,
    });
  }, [apiReady]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      loading,
      error,
      apiReady,
      bootstrap,
      stats: bootstrap?.stats ?? null,
      analytics,
      refresh,
      reloadCalendarDay,
    }),
    [loading, error, apiReady, bootstrap, analytics, refresh, reloadCalendarDay],
  );

  if (loading && apiReady && !bootstrap) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 rounded-full border-[3px] border-violet-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error && apiReady && !bootstrap) {
    return (
      <div className="max-w-md mx-auto py-16 text-center px-4">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        <button
          type="button"
          onClick={() => void refresh()}
          className="mt-4 px-4 py-2 rounded-xl text-sm font-medium common-button-bg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <AppointmentCRMContext.Provider value={value}>{children}</AppointmentCRMContext.Provider>
  );
}
