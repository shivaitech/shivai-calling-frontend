import { useEffect, useMemo, useState } from "react";
import { Clock, Eye, Layers, Pencil, Share2, X } from "lucide-react";
import CalendarDateNav, { calendarToolbarShellClass } from "./CalendarDateNav";
import GlassCard from "../../../components/GlassCard";
import { SectionTitle } from "../SupportCRM/ui";
import { useAppointmentIndustry } from "./industryConfig";
import { useActiveBranch } from "./branchesStore";
import { useDepartments } from "./departmentsStore";
import { useStaff, StaffMember, staffRoleLine } from "./staffStore";
import { useBookings, bookingMatchesViewDate } from "./bookingsStore";
import { useEnsureOrgSeeded } from "./orgSeed";
import {
  useStaffSchedule,
  getLeaveOnDate,
  CalendarCellState,
  toIsoDate,
} from "./availabilityStore";
import {
  CALENDAR_SLOT_HEIGHT_PX,
  bookingOverlapsSlot,
  formatAxisTimeCompact,
  generateDaySlots,
  generateHourLabels,
  minutesToTopPx,
  totalCalendarHeightPx,
} from "./calendarUtils";
import { useCalendarConfig } from "./calendarConfig";
import type { Booking } from "./mockData";
import BookingDetailModal from "./BookingDetailModal";
import StaffScheduleModal from "./StaffScheduleModal";
import CalendarBookingCard from "./CalendarBookingCard";
import CalendarOfflineBlockCard from "./CalendarOfflineBlockCard";
import OfflineBlockDetailModal from "./OfflineBlockDetailModal";
import DeleteOfflineBlockModal from "./DeleteOfflineBlockModal";
import ShareDoctorCalendarModal from "./ShareDoctorCalendarModal";
import appToast from "../../../components/AppToast";
import {
  blockTypeLabel,
  getOfflineBlocksForStaffOnDate,
  isManualBookingBlock,
  offlineBlockOverlapsSlot,
  removeOfflineBlock,
  useOfflineBlocks,
  StaffOfflineBlock,
} from "./offlineBlocksStore";

const SLOT_BG: Record<CalendarCellState, string> = {
  available: "bg-white dark:bg-slate-800",
  booking: "bg-white dark:bg-slate-800",
  offline: "bg-amber-50/50 dark:bg-amber-950/10",
  break: "bg-[repeating-linear-gradient(-45deg,transparent,transparent_3px,rgb(186_230_253/0.45)_3px,rgb(186_230_253/0.45)_6px)] dark:bg-[repeating-linear-gradient(-45deg,transparent,transparent_3px,rgb(12_74_110/0.35)_3px,rgb(12_74_110/0.35)_6px)]",
  leave: "bg-red-50/60 dark:bg-red-950/15",
  unavailable: "bg-slate-100/80 dark:bg-slate-800/60",
};

const TIME_AXIS_WIDTH = 48;
const STAFF_COL_MIN = 108;

interface CalendarViewProps {
  /** Lock to one staff column — used for doctor personal calendar after temp-credential login. */
  lockedStaffId?: string;
  readOnly?: boolean;
}

const CalendarView = ({ lockedStaffId, readOnly = false }: CalendarViewProps) => {
  const { terms } = useAppointmentIndustry();
  const { branches, activeBranchId, setActiveBranch } = useActiveBranch();
  useEnsureOrgSeeded(branches);
  const { departments } = useDepartments();
  const { staff, displayName } = useStaff();
  const bookings = useBookings();
  const offlineBlocks = useOfflineBlocks();
  const { slotStateAtMinute } = useStaffSchedule();

  const [viewDate, setViewDate] = useState(() => new Date());
  const [deptId, setDeptId] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedOfflineBlock, setSelectedOfflineBlock] = useState<StaffOfflineBlock | null>(null);
  const [scheduleStaff, setScheduleStaff] = useState<StaffMember | null>(null);
  const [focusedStaffId, setFocusedStaffId] = useState<string | null>(lockedStaffId ?? null);
  const [shareStaff, setShareStaff] = useState<StaffMember | null>(null);
  const [pendingDeleteBlock, setPendingDeleteBlock] = useState<StaffOfflineBlock | null>(null);
  const [deletingBlock, setDeletingBlock] = useState(false);

  const branchId = activeBranchId ?? "";
  const { dayStartMin, dayEndMin, slotMinutes } = useCalendarConfig(branchId || null);

  useEffect(() => {
    if (!lockedStaffId) return;
    setFocusedStaffId(lockedStaffId);
    const member = staff.find((s) => s.id === lockedStaffId);
    if (member?.branchId) setActiveBranch(member.branchId);
  }, [lockedStaffId, staff, setActiveBranch]);

  useEffect(() => {
    if (lockedStaffId) return;
    setDeptId("all");
    setFocusedStaffId(null);
  }, [branchId, lockedStaffId]);

  useEffect(() => {
    if (lockedStaffId) return;
    setFocusedStaffId(null);
  }, [deptId, lockedStaffId]);

  const handleConfirmDeleteBlock = async () => {
    if (!pendingDeleteBlock || deletingBlock) return;
    setDeletingBlock(true);
    const toastId = appToast.loading("Removing…");
    try {
      await removeOfflineBlock(pendingDeleteBlock.id);
      appToast.dismiss(toastId);
      const label = blockTypeLabel(pendingDeleteBlock).toLowerCase();
      appToast.success(
        isManualBookingBlock(pendingDeleteBlock) && pendingDeleteBlock.patientName
          ? `Removed booking for ${pendingDeleteBlock.patientName}`
          : `${label.charAt(0).toUpperCase() + label.slice(1)} removed`,
      );
      if (selectedOfflineBlock?.id === pendingDeleteBlock.id) {
        setSelectedOfflineBlock(null);
      }
      setPendingDeleteBlock(null);
    } catch {
      appToast.dismiss(toastId);
      appToast.error("Could not remove. Please try again.");
    } finally {
      setDeletingBlock(false);
    }
  };

  const branchDepts = useMemo(
    () => departments.filter((d) => d.branchId === branchId && d.active),
    [departments, branchId],
  );

  const calendarStaff = useMemo(() => {
    if (lockedStaffId) {
      const one = staff.find((s) => s.id === lockedStaffId && s.active);
      return one ? [one] : [];
    }
    if (deptId === "all") {
      return staff.filter((s) => s.branchId === branchId && s.active);
    }
    return staff.filter((s) => s.departmentId === deptId && s.active);
  }, [staff, branchId, deptId, lockedStaffId]);

  const displayStaff = useMemo(() => {
    if (!focusedStaffId) return calendarStaff;
    const one = calendarStaff.find((s) => s.id === focusedStaffId);
    return one ? [one] : calendarStaff;
  }, [calendarStaff, focusedStaffId]);

  const focusedStaff = focusedStaffId
    ? calendarStaff.find((s) => s.id === focusedStaffId)
    : null;

  const dayBookings = useMemo(
    () =>
      bookings.filter((b) => {
        if (branchId && b.branchId !== branchId) return false;
        if (deptId !== "all" && b.departmentId !== deptId) return false;
        if (b.status === "cancelled") return false;
        return bookingMatchesViewDate(b, viewDate);
      }),
    [bookings, branchId, deptId, viewDate],
  );

  const timeSlots = useMemo(
    () => generateDaySlots(dayStartMin, dayEndMin, slotMinutes),
    [dayStartMin, dayEndMin, slotMinutes],
  );
  const hourLabels = useMemo(
    () => generateHourLabels(dayStartMin, dayEndMin),
    [dayStartMin, dayEndMin],
  );
  const halfHourLabels = useMemo(
    () => generateDaySlots(dayStartMin, dayEndMin, slotMinutes).filter((m) => m % 60 === 30),
    [dayStartMin, dayEndMin, slotMinutes],
  );
  const gridHeight = totalCalendarHeightPx(dayStartMin, dayEndMin);

  const staffBookings = useMemo(() => {
    const map = new Map<string, Booking[]>();
    displayStaff.forEach((s) => map.set(s.id, []));
    dayBookings.forEach((b) => {
      if (b.staffId && map.has(b.staffId)) {
        map.get(b.staffId)!.push(b);
      }
    });
    return map;
  }, [displayStaff, dayBookings]);

  const viewIso = toIsoDate(viewDate);

  const staffOfflineBlocks = useMemo(() => {
    const map = new Map<string, StaffOfflineBlock[]>();
    displayStaff.forEach((s) => map.set(s.id, getOfflineBlocksForStaffOnDate(s.id, viewIso)));
    return map;
  }, [displayStaff, viewIso, offlineBlocks]);

  if (!branchId) {
    return (
      <div className="space-y-5">
        <SectionTitle title="Calendar" subtitle={`Select a ${terms.branch.toLowerCase()} in Command Center`} />
        <GlassCard>
          <p className="p-6 text-sm text-slate-500 text-center">No active {terms.branch.toLowerCase()} selected.</p>
        </GlassCard>
      </div>
    );
  }

  if (!calendarStaff.length) {
    return (
      <div className="space-y-5">
        <SectionTitle title="Calendar" subtitle={`Add ${terms.staffPlural.toLowerCase()} in Staff & Departments to view calendars`} />
        <GlassCard>
          <p className="p-6 text-sm text-slate-500 text-center">
            No {terms.staffPlural.toLowerCase()} in this {terms.department.toLowerCase()} yet.
          </p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-5">
      <SectionTitle
        title={lockedStaffId && focusedStaff ? displayName(focusedStaff) : "Calendar"}
        subtitle={
          lockedStaffId
            ? `Your ${terms.appointments.toLowerCase()} · ${slotMinutes}-min slots`
            : `${terms.appointments} by ${terms.staff.toLowerCase()} · ${slotMinutes}-min slots`
        }
        stackOnMobile
        right={
          <>
            <div className="w-full sm:hidden">
              <CalendarDateNav
                viewDate={viewDate}
                onViewDateChange={(date) => setViewDate(new Date(date))}
                fullWidth
                compact
              />
            </div>
            <div className="hidden sm:block">
              <CalendarDateNav
                viewDate={viewDate}
                onViewDateChange={(date) => setViewDate(new Date(date))}
              />
            </div>
          </>
        }
      />

      <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:gap-1.5 text-[9px] sm:text-[9px]">
        {[
          { label: "Available", dot: "bg-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200/70" },
          { label: "Booked", dot: "bg-violet-500", bg: "bg-violet-50 dark:bg-violet-950/20 text-violet-700 dark:text-violet-400 border-violet-200/70" },
          { label: "Manual", dot: "bg-amber-500", bg: "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200/70" },
          { label: "Break", dot: "bg-sky-500", bg: "bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 border-sky-200/70" },
          { label: "Leave", dot: "bg-red-400", bg: "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200/70" },
          { label: "Off hours", dot: "bg-slate-300", bg: "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700" },
        ].map((item) => (
          <span
            key={item.label}
            className={`inline-flex items-center justify-center sm:justify-start gap-1 px-1.5 sm:px-2 py-1 sm:py-0.5 rounded-full border ${item.bg}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
            {item.label}
          </span>
        ))}
      </div>

      {!lockedStaffId && branchDepts.length > 0 && (
        <div className="-mx-1 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex items-center gap-2 px-1 pb-0.5 min-w-min">
            <Layers className="w-4 h-4 text-slate-400 shrink-0" />
            <button
              type="button"
              onClick={() => setDeptId("all")}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
                deptId === "all" ? "bg-slate-800 dark:bg-white text-white dark:text-slate-900 border-transparent" : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
              }`}
            >
              All {terms.departments}
            </button>
            {branchDepts.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDeptId(d.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
                  deptId === d.id ? "bg-violet-600 text-white border-violet-600" : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <GlassCard>
        {focusedStaff && !lockedStaffId && (
          <div className="mx-1.5 mt-1.5 sm:mx-2 sm:mt-2 mb-1 flex flex-wrap items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-slate-200/70 dark:border-slate-700/70 bg-gradient-to-r from-slate-50/90 via-white to-violet-50/40 dark:from-slate-800/60 dark:via-slate-900/80 dark:to-violet-950/20">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold shadow-sm"
                style={{
                  background: `linear-gradient(135deg, hsl(${focusedStaff.hue},70%,55%), hsl(${focusedStaff.hue + 20},65%,45%))`,
                }}
              >
                {focusedStaff.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Single {terms.staff.toLowerCase()} view
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {displayName(focusedStaff)}
                </p>
              </div>
            </div>
            <div className="flex items-stretch gap-2 flex-shrink-0 ml-auto">
              <div className={calendarToolbarShellClass()}>
                <button
                  type="button"
                  onClick={() => setShareStaff(focusedStaff)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-left common-button-bg h-full"
                >
                  <Share2 className="w-4 h-4 flex-shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold leading-tight">Share</span>
                    <span className="block text-[10px] leading-tight opacity-90 truncate max-w-[100px] sm:max-w-[140px]">
                      Send calendar link
                    </span>
                  </span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setFocusedStaffId(null)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
                Show all
              </button>
            </div>
          </div>
        )}
        <div className="p-1.5 sm:p-2 overflow-x-auto">
          <div
            className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
            style={{
              minWidth: Math.max(
                280,
                TIME_AXIS_WIDTH + displayStaff.length * STAFF_COL_MIN,
              ),
            }}
          >
            {/* Staff headers */}
            <div
              className="grid border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              style={{ gridTemplateColumns: `${TIME_AXIS_WIDTH}px repeat(${displayStaff.length}, minmax(${STAFF_COL_MIN}px, 1fr))` }}
            >
              <div className="flex items-end justify-center px-1 py-1.5 border-r border-slate-200 dark:border-slate-700">
                <Clock className="w-3 h-3 text-slate-400" />
              </div>
              {displayStaff.map((col) => {
                const leave = getLeaveOnDate(col.id, toIsoDate(viewDate));
                const isFocused = focusedStaffId === col.id;
                return (
                  <div
                    key={col.id}
                    className={`flex flex-col gap-1.5 px-1.5 py-1.5 border-r border-slate-200 dark:border-slate-700 last:border-r-0 min-w-0 ${
                      isFocused ? "bg-violet-50/80 dark:bg-violet-950/20" : ""
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div
                        className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold"
                        style={{ background: `linear-gradient(135deg, hsl(${col.hue},70%,55%), hsl(${col.hue + 20},65%,45%))` }}
                      >
                        {col.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-slate-800 dark:text-white truncate leading-tight">
                          {displayName(col)}
                        </p>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 truncate leading-tight">
                          {leave ? "On leave" : staffRoleLine(col)}
                        </p>
                      </div>
                    </div>
                    {!readOnly && (
                      <div className="flex flex-wrap items-center justify-start gap-1.5 w-full">
                        {!lockedStaffId && (
                          <button
                            type="button"
                            onClick={() => setFocusedStaffId(col.id)}
                            className={`inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium border transition-colors shrink-0 ${
                              focusedStaffId === col.id
                                ? "border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/30"
                                : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800"
                            }`}
                            title={`View only ${displayName(col)}`}
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setScheduleStaff(col)}
                          className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 hover:bg-violet-50 dark:hover:bg-violet-900/30 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-700 dark:hover:text-violet-300 transition-colors shrink-0"
                          title={`Edit ${displayName(col)} hours & bookings`}
                        >
                          <Pencil className="w-3 h-3" />
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Time grid */}
            <div className="flex bg-white dark:bg-slate-800">
              {/* Time axis */}
              <div
                className="flex-shrink-0 border-r border-slate-200 dark:border-slate-700 relative"
                style={{ width: TIME_AXIS_WIDTH, height: gridHeight }}
              >
                {hourLabels.map((mins) => (
                  <div
                    key={mins}
                    className="absolute left-0 right-0 flex items-start justify-end pr-1 -translate-y-1/2"
                    style={{ top: minutesToTopPx(mins, dayStartMin) }}
                  >
                    <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 tabular-nums leading-none whitespace-nowrap">
                      {formatAxisTimeCompact(mins)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Staff columns */}
              <div className="flex flex-1 min-w-0 relative">
                {/* Hour & half-hour guide lines across all columns */}
                {hourLabels.map((mins) => (
                  <div
                    key={`hour-line-${mins}`}
                    className="absolute left-0 right-0 border-t border-slate-200 dark:border-slate-700 pointer-events-none z-[1]"
                    style={{ top: minutesToTopPx(mins, dayStartMin) }}
                  />
                ))}
                {halfHourLabels.map((mins) => (
                  <div
                    key={`half-line-${mins}`}
                    className="absolute left-0 right-0 border-t border-dotted border-slate-100 dark:border-slate-700/60 pointer-events-none z-[1]"
                    style={{ top: minutesToTopPx(mins, dayStartMin) }}
                  />
                ))}

                {displayStaff.map((col) => {
                  const colBookings = staffBookings.get(col.id) ?? [];
                  const colOffline = staffOfflineBlocks.get(col.id) ?? [];
                  const onLeave = Boolean(getLeaveOnDate(col.id, viewIso));

                  return (
                    <div
                      key={col.id}
                      className={`flex-1 relative border-r border-slate-200 dark:border-slate-700 last:border-r-0 ${
                        onLeave ? "bg-red-50/30 dark:bg-red-950/10" : ""
                      }`}
                      style={{ height: gridHeight, minWidth: STAFF_COL_MIN }}
                    >
                      {timeSlots.map((slotMin) => {
                        const hasBooking = colBookings.some((b) => bookingOverlapsSlot(b, slotMin));
                        const hasOffline = colOffline.some((o) => offlineBlockOverlapsSlot(o, slotMin));
                        const state = slotStateAtMinute(col.id, slotMin, viewDate, hasBooking || hasOffline);
                        if (state === "booking" || hasOffline) return null;
                        return (
                          <div
                            key={slotMin}
                            className={`absolute left-0 right-0 ${SLOT_BG[state]}`}
                            style={{
                              top: minutesToTopPx(slotMin, dayStartMin),
                              height: CALENDAR_SLOT_HEIGHT_PX,
                            }}
                          />
                        );
                      })}

                      {colOffline.map((block) => (
                        <CalendarOfflineBlockCard
                          key={block.id}
                          block={block}
                          dayStartMin={dayStartMin}
                          dayEndMin={dayEndMin}
                          onClick={() => setSelectedOfflineBlock(block)}
                        />
                      ))}

                      {colBookings.map((booking) => (
                        <CalendarBookingCard
                          key={booking.id}
                          booking={booking}
                          dayStartMin={dayStartMin}
                          dayEndMin={dayEndMin}
                          onClick={() => setSelectedBooking(booking)}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {!lockedStaffId && (
        <p className="text-[10px] text-slate-400 sm:hidden">
          Tap <strong>View</strong> for one {terms.staff.toLowerCase()} · <strong>Edit</strong> for hours & bookings
        </p>
      )}

      <BookingDetailModal
        open={Boolean(selectedBooking)}
        booking={selectedBooking}
        staffLabel={terms.staff}
        customerLabel={terms.customer}
        onClose={() => setSelectedBooking(null)}
      />

      <OfflineBlockDetailModal
        open={Boolean(selectedOfflineBlock)}
        block={selectedOfflineBlock}
        staffName={
          selectedOfflineBlock
            ? displayName(staff.find((s) => s.id === selectedOfflineBlock.staffId)!)
            : ""
        }
        onClose={() => setSelectedOfflineBlock(null)}
        onRemove={
          readOnly
            ? undefined
            : () => {
                if (selectedOfflineBlock) {
                  setPendingDeleteBlock(selectedOfflineBlock);
                  setSelectedOfflineBlock(null);
                }
              }
        }
      />

      <DeleteOfflineBlockModal
        open={Boolean(pendingDeleteBlock)}
        block={pendingDeleteBlock}
        onClose={() => !deletingBlock && setPendingDeleteBlock(null)}
        onConfirm={handleConfirmDeleteBlock}
        deleting={deletingBlock}
      />

      {!readOnly && (
        <StaffScheduleModal
          open={Boolean(scheduleStaff)}
          staffId={scheduleStaff?.id ?? null}
          staffName={scheduleStaff ? displayName(scheduleStaff) : ""}
          onClose={() => setScheduleStaff(null)}
        />
      )}

      {!readOnly && !lockedStaffId && (
        <ShareDoctorCalendarModal
          open={Boolean(shareStaff)}
          staff={shareStaff}
          onClose={() => setShareStaff(null)}
        />
      )}
    </div>
  );
};

export default CalendarView;
