import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  CalendarCheck,
  CalendarX,
  Clock,
  Layers,
  Phone,
  UserCheck,
  Users,
} from "lucide-react";
import GlassCard from "../../../components/GlassCard";
import { AgentAvatar, StatCard, SectionTitle } from "../SupportCRM/ui";
import { useAppointmentIndustry } from "./industryConfig";
import { useAppointmentSetup } from "./setupStore";
import { useActiveBranch } from "./branchesStore";
import { SCHEDULING_AGENTS } from "./mockData";
import { useBookings } from "./bookingsStore";
import { useDepartments } from "./departmentsStore";
import { useStaff } from "./staffStore";
import BranchSwitcher from "./BranchSwitcher";
import type { Booking } from "./mockData";

interface Props {
  onOpenAgent?: (id: string) => void;
}

const HOUR_SLOTS = ["09", "10", "11", "12", "13", "14", "15", "16", "17"];

const OverviewView = ({ onOpenAgent }: Props) => {
  const setup = useAppointmentSetup();
  const { terms, preset } = useAppointmentIndustry();
  const { activeBranch, activeBranchId } = useActiveBranch();
  const bookings = useBookings();
  const { departments } = useDepartments();
  const { staff } = useStaff();

  const branchBookings = useMemo(
    () => (activeBranchId ? bookings.filter((b) => b.branchId === activeBranchId) : bookings),
    [bookings, activeBranchId],
  );

  const todayBookings = useMemo(
    () => branchBookings.filter((b) => b.date === "Today"),
    [branchBookings],
  );

  const metrics = useMemo(() => {
    const confirmedToday = todayBookings.filter((b) => b.status === "confirmed" || b.status === "checked-in").length;
    const pendingConfirmation = todayBookings.filter((b) => b.status === "pending").length;
    const noShowsToday = todayBookings.filter((b) => b.status === "no-show").length;
    const branchStaff = activeBranchId
      ? staff.filter((s) => s.branchId === activeBranchId && s.active)
      : staff.filter((s) => s.active);
    const utilizationPct = branchStaff.length
      ? Math.min(100, Math.round((todayBookings.length / (branchStaff.length * 8)) * 100))
      : 0;

    const hourlyBookings = HOUR_SLOTS.map((hour) => ({
      hour,
      count: todayBookings.filter((b) => b.time.slice(0, 2) === hour).length,
    }));

    return {
      bookingsToday: todayBookings.length,
      confirmedToday,
      pendingConfirmation,
      noShowsToday,
      utilizationPct,
      avgBookingSec: 142,
      reminderDeliveryPct: 96,
      rescheduleRate: todayBookings.length
        ? Math.round((todayBookings.filter((b) => b.status === "cancelled").length / todayBookings.length) * 100)
        : 0,
      hourlyBookings,
    };
  }, [todayBookings, staff, activeBranchId]);

  const branchDepts = useMemo(
    () => (activeBranchId ? departments.filter((d) => d.branchId === activeBranchId && d.active) : []),
    [departments, activeBranchId],
  );

  const branchStaffCount = useMemo(
    () => (activeBranchId ? staff.filter((s) => s.branchId === activeBranchId && s.active).length : 0),
    [staff, activeBranchId],
  );

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
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-800 dark:text-white">{branchDepts.length}</p>
                  <p className="text-[10px] text-slate-500">{terms.departments}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Users className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-800 dark:text-white">{branchStaffCount}</p>
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
        <StatCard icon={Clock} color="amber" label="Pending Confirmation" value={metrics.pendingConfirmation} sub="Awaiting callback" subTone="warn" />
        <StatCard icon={CalendarX} color="red" label="No-shows Today" value={metrics.noShowsToday} sub={`${metrics.rescheduleRate}% cancel rate`} subTone="muted" />
        <StatCard icon={UserCheck} color="emerald" label="Calendar Utilization" value={`${metrics.utilizationPct}%`} sub={`Avg book time ${metrics.avgBookingSec}s`} subTone="up" />
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
                <div key={h.hour} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100">{h.count}</span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(h.count / maxVol) * 100}%` }}
                    className="w-full rounded-t-md bg-gradient-to-t from-violet-500 to-purple-400 min-h-[4px]"
                  />
                  <span className="text-[10px] text-slate-400">{h.hour}:00</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="p-4 sm:p-6 space-y-3">
            <h3 className="text-base font-semibold text-slate-800 dark:text-white">Reminders</h3>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{metrics.reminderDeliveryPct}%</p>
            <p className="text-xs text-slate-500">Delivery rate today</p>
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
              <span className="text-xs text-slate-500">{SCHEDULING_AGENTS.length} active</span>
            </div>
            <div className="space-y-2">
              {SCHEDULING_AGENTS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onOpenAgent?.(a.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700 transition-all text-left"
                >
                  <AgentAvatar name={a.name} hue={a.avatarHue} status={a.status} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{a.name}</p>
                    <p className="text-xs text-slate-500">{a.bookingsToday} bookings · {a.noShowRate}% no-show</p>
                  </div>
                  <Phone className="w-4 h-4 text-slate-400" />
                </button>
              ))}
            </div>
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
