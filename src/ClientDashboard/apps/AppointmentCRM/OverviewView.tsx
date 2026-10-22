import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Briefcase,
  Building2,
  CalendarCheck,
  CalendarX,
  Clock,
  Layers,
  UserCheck,
  Users,
} from "lucide-react";
import GlassCard from "../../../components/GlassCard";
import { StatCard, SectionTitle } from "../SupportCRM/ui";
import { Bot } from "lucide-react";
import { useAppointmentIndustry } from "./industryConfig";
import { useAppointmentSetup } from "./setupStore";
import { useActiveBranch } from "./branchesStore";
import { useAssignedAgentCrmConfigIds } from "../../../marketplace/useAgentCrmConfig";
import { useBookings, fetchStaffBookingsForCalendar } from "./bookingsStore";
import { useIntegratedSchedules, toIsoDate } from "./availabilityStore";
import { departmentsAPI, designationsAPI } from "../../../services/departmentsAPI";
import { parseTimeToMinutes, formatAxisTimeCompact } from "./calendarUtils";
import { agentAPI, type ApiAgent } from "../../../services/agentAPI";
import BranchSwitcher from "./BranchSwitcher";
import appToast from "../../../components/AppToast";
import type { Booking } from "./mockData";

// Hour-of-day buckets for the "Bookings by hour" chart, as minutes from
// midnight (9 AM–5 PM) — bucketing compares against parsed booking minutes
// rather than string-slicing booking.time, since that's formatted 12-hour
// ("10:00 AM") and a slice-based match silently dropped the PM half.
const HOUR_SLOTS = [9, 10, 11, 12, 13, 14, 15, 16, 17].map((h) => h * 60);

const OverviewView = () => {
  const navigate = useNavigate();
  const setup = useAppointmentSetup();
  const { terms, preset } = useAppointmentIndustry();
  const { activeBranch } = useActiveBranch();
  const bookings = useBookings();
  const { agentIds: assignedAgentIds, loading: assignmentsLoading } = useAssignedAgentCrmConfigIds();

  // Resolve each assigned id directly via GET /agent-configs/:id — GET
  // /agents is paginated with no limit override, so an assigned agent
  // outside that default page would silently disappear from a
  // rawAgents.find() lookup even though /ai-config correctly says it's
  // assigned. GET /agents/:id is a different, tenant-scoped endpoint that
  // 404s here; /agent-configs/:id resolves any agent by id.
  const [assignedAgents, setAssignedAgents] = useState<ApiAgent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  useEffect(() => {
    if (assignmentsLoading) return;
    setAgentsLoading(true);
    Promise.all(
      assignedAgentIds.map((id) => agentAPI.getAgentConfig(id).then((res) => res.agent as ApiAgent).catch(() => null)),
    )
      .then((agents) => setAssignedAgents(agents.filter((a): a is ApiAgent => Boolean(a))))
      .finally(() => setAgentsLoading(false));
  }, [assignedAgentIds, assignmentsLoading]);

  // Overview must show real numbers on its own — it can't rely on the
  // Calendar or Bookings page having already populated the shared cache.
  const { schedules: integratedSchedules, loading: staffLoading } = useIntegratedSchedules();
  useEffect(() => {
    if (staffLoading) return;
    const staffWithNames = integratedSchedules
      .filter((s) => s.staff)
      .map((s) => ({ id: s.staff_id, name: s.staff!.fullName }));
    if (staffWithNames.length === 0) return;
    void fetchStaffBookingsForCalendar({
      staffIds: staffWithNames.map((s) => s.id),
      dateIso: toIsoDate(new Date()),
      branchName: activeBranch?.name,
    }).catch(() => {
      appToast.error("Couldn't load today's bookings.");
    });
  }, [integratedSchedules, staffLoading, activeBranch?.name]);

  // The /appointments API carries no branchId on its booking rows, so
  // there's nothing real to filter on here — every integrated staff member
  // is already fetched above.
  const branchBookings = bookings;

  const todayBookings = useMemo(
    () => branchBookings.filter((b) => b.date === "Today"),
    [branchBookings],
  );

  // Real department/designation counts come from the global tenant catalog
  // (departmentsAPI/designationsAPI) — the Schedule API's staff summary has
  // no department/designation field at all, so there's no per-branch real
  // number to derive instead.
  const [catalogCounts, setCatalogCounts] = useState<{ departments: number; designations: number } | null>(null);
  useEffect(() => {
    let cancelled = false;
    Promise.all([departmentsAPI.list({ limit: 1 }), designationsAPI.list({ limit: 1 })])
      .then(([deptRes, desigRes]) => {
        if (cancelled) return;
        setCatalogCounts({
          departments: deptRes.pagination.total,
          designations: desigRes.pagination.total,
        });
      })
      .catch(() => {
        if (!cancelled) setCatalogCounts(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Real staff count: who actually has a live schedule on this Calendar —
  // the same source of truth the Calendar itself uses, not the legacy
  // branch-scoped staff store.
  const integratedStaffCount = integratedSchedules.filter((s) => s.staff).length;

  const metrics = useMemo(() => {
    const confirmedToday = todayBookings.filter((b) => b.status === "booked").length;
    const cancelledToday = todayBookings.filter((b) => b.status === "cancelled").length;
    const utilizationPct = integratedStaffCount
      ? Math.min(100, Math.round((todayBookings.length / (integratedStaffCount * 8)) * 100))
      : 0;

    const hourlyBookings = HOUR_SLOTS.map((hourMin) => ({
      hourMin,
      count: todayBookings.filter((b) => {
        const bookingMin = parseTimeToMinutes(b.time);
        return bookingMin >= hourMin && bookingMin < hourMin + 60;
      }).length,
    }));

    return {
      bookingsToday: todayBookings.length,
      confirmedToday,
      cancelledToday,
      utilizationPct,
      rescheduleRate: todayBookings.length
        ? Math.round((cancelledToday / todayBookings.length) * 100)
        : 0,
      hourlyBookings,
    };
  }, [todayBookings, integratedStaffCount]);

  const upcoming = useMemo(
    () => branchBookings.filter((b) => b.date === "Today" && b.status !== "cancelled"),
    [branchBookings],
  );

  const maxVol = Math.max(1, ...metrics.hourlyBookings.map((h) => h.count));

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Scheduling Command Center"
        subtitle={`${setup.companyName || "Your organization"} · ${preset.name}`}
        right={
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 border border-violet-200/70 dark:border-violet-800/50">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" /> Live
          </span>
        }
      />

      <GlassCard>
        <div className="p-4 sm:p-5">
          <BranchSwitcher variant="command" />
          {activeBranch && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-800 dark:text-white">{catalogCounts?.departments ?? "—"}</p>
                  <p className="text-[10px] text-slate-500">{terms.departments}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-sky-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-800 dark:text-white">{catalogCounts?.designations ?? "—"}</p>
                  <p className="text-[10px] text-slate-500">Designations</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Users className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-800 dark:text-white">{integratedStaffCount}</p>
                  <p className="text-[10px] text-slate-500">{terms.staffPlural}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-800 dark:text-white">{metrics.bookingsToday}</p>
                  <p className="text-[10px] text-slate-500">Today&apos;s {terms.appointments.toLowerCase()}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={CalendarCheck} color="purple" label={`${terms.appointments} Today`} value={metrics.bookingsToday} sub={`${metrics.confirmedToday} confirmed`} subTone="up" />
        <StatCard icon={Clock} color="amber" label="Booked Today" value={metrics.confirmedToday} sub="Active bookings" subTone="up" />
        <StatCard icon={CalendarX} color="red" label="Cancelled Today" value={metrics.cancelledToday} sub={`${metrics.rescheduleRate}% cancel rate`} subTone="muted" />
        <StatCard icon={UserCheck} color="emerald" label="Calendar Utilization" value={`${metrics.utilizationPct}%`} sub="Of today's staff hours" subTone="up" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <GlassCard className="xl:col-span-2">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-slate-800 dark:text-white">
                Bookings — Today{activeBranch ? ` · ${activeBranch.name}` : ""}
              </h3>
              <span className="text-xs text-slate-500">By hour</span>
            </div>
            <div className="flex items-end justify-between gap-2 h-36">
              {metrics.hourlyBookings.map((h) => (
                <div key={h.hourMin} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100">{h.count}</span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(h.count / maxVol) * 100}%` }}
                    className="w-full rounded-t-md bg-gradient-to-t from-violet-500 to-purple-400 min-h-[4px]"
                  />
                  <span className="text-[10px] text-slate-400">{formatAxisTimeCompact(h.hourMin)}</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="p-4 sm:p-6 space-y-3">
            <h3 className="text-base font-semibold text-slate-800 dark:text-white">Reminder channels</h3>
            <p className="text-xs text-slate-500">Configured for this {terms.branch.toLowerCase()}</p>
            <div className="flex flex-wrap gap-1.5 pt-2">
              {preset.reminderChannels.map((ch) => (
                <span key={ch} className="text-[10px] px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 uppercase">
                  {ch}
                </span>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard>
          <div className="p-4 sm:p-6">
            <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-4">Upcoming {terms.appointments}</h3>
            <div className="space-y-2">
              {upcoming.length ? (
                upcoming.slice(0, 4).map((b) => <BookingRow key={b.id} booking={b} />)
              ) : (
                <p className="text-sm text-slate-500 py-4 text-center">No upcoming {terms.appointments.toLowerCase()} for this {terms.branch.toLowerCase()}</p>
              )}
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-800 dark:text-white">AI {terms.agent}s</h3>
              <span className="text-xs text-slate-500">{assignedAgents.length} assigned</span>
            </div>
            {agentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : assignedAgents.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">No AI agents assigned yet — assign one from the AI Configuration tab.</p>
            ) : (
              <div className="space-y-2">
                {assignedAgents.slice(0, 5).map((agent) => (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => navigate(`/agents/${agent.id}`)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700 transition-all text-left"
                  >
                    <div className="w-10 h-10 common-bg-icons rounded-xl flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-slate-900 dark:text-slate-100" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">{agent.name}</p>
                    </div>
                    <span className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium text-violet-600 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/30 border border-violet-200/70 dark:border-violet-800/50">
                      View
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

const BookingRow = ({ booking }: { booking: Booking }) => (
  <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
    <div className="text-center flex-shrink-0 w-12">
      <p className="text-xs font-bold text-violet-600 dark:text-violet-400">{booking.time}</p>
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{booking.customer}</p>
      <p className="text-[11px] text-slate-500 truncate">{booking.service} · {booking.provider}</p>
    </div>
  </div>
);

export default OverviewView;
