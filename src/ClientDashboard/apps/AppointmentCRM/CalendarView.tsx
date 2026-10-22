import { useEffect, useMemo, useState } from "react";
import { CalendarPlus, Loader2, Pencil, Share2, Trash2, UserPlus, X } from "lucide-react";
import CalendarDateNav, { calendarToolbarShellClass } from "./CalendarDateNav";
import GlassCard from "../../../components/GlassCard";
import { SectionTitle } from "../SupportCRM/ui";
import { useAppointmentIndustry } from "./industryConfig";
import { useActiveBranch } from "./branchesStore";
import BranchSwitcher from "./BranchSwitcher";
import { useStaff, StaffMember } from "./staffStore";
import { useBookings, bookingMatchesViewDate, fetchStaffBookingsForCalendar } from "./bookingsStore";
import { getActivePreset } from "./industryConfig";
import { hueFromSeed } from "./api/mappers";
import {
  useStaffSchedule,
  useIntegratedSchedules,
  removeAvailabilityForStaff,
  getLeaveOnDate,
  toIsoDate,
} from "./availabilityStore";
import { generateHourLabels, minutesToTimeInput } from "./calendarUtils";
import CalendarMobileTimeline from "./CalendarMobileTimeline";
import { useCalendarConfig } from "./calendarConfig";
import type { Booking } from "./mockData";
import BookingDetailModal from "./BookingDetailModal";
import StaffScheduleModal from "./StaffScheduleModal";
import IntegrateStaffModal from "./IntegrateStaffModal";
import AddBookingModal from "./AddBookingModal";
import RemoveStaffModal from "./RemoveStaffModal";
import { useNowWithinRange } from "./CalendarNowLine";
import OfflineBlockDetailModal from "./OfflineBlockDetailModal";
import DeleteOfflineBlockModal from "./DeleteOfflineBlockModal";
import ShareDoctorCalendarModal from "./ShareDoctorCalendarModal";
import appToast from "../../../components/AppToast";
import {
  blockTypeLabel,
  getOfflineBlocksForStaffOnDate,
  isManualBookingBlock,
  removeOfflineBlock,
  useOfflineBlocks,
  StaffOfflineBlock,
} from "./offlineBlocksStore";

type ViewMode = "solo" | "multi" | "week" | "room";

interface CalendarViewProps {
  /** Lock to one staff column — used for doctor personal calendar after temp-credential login. */
  lockedStaffId?: string;
  readOnly?: boolean;
}

const CalendarView = ({ lockedStaffId, readOnly = false }: CalendarViewProps) => {
  const { terms } = useAppointmentIndustry();
  const { branches, activeBranchId, setActiveBranch } = useActiveBranch();
  const { staff, displayName } = useStaff();
  const bookings = useBookings();
  const offlineBlocks = useOfflineBlocks();
  const { slotStateAtMinute } = useStaffSchedule();
  // The Calendar's staff list is built DIRECTLY from the Schedule API's own
  // records — not cross-referenced against a separate branch StaffMember
  // list — so a live schedule always shows and nothing can go invisible
  // because of a mismatched/orphaned record on either side.
  const { schedules: integratedSchedules, loading: integratedStaffLoading } = useIntegratedSchedules();

  const [viewDate, setViewDate] = useState(() => new Date());
  const [deptId, setDeptId] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedOfflineBlock, setSelectedOfflineBlock] = useState<StaffOfflineBlock | null>(null);
  const [scheduleStaff, setScheduleStaff] = useState<StaffMember | null>(null);
  const [focusedStaffId, setFocusedStaffId] = useState<string | null>(lockedStaffId ?? null);
  const [shareStaff, setShareStaff] = useState<StaffMember | null>(null);
  const [pendingDeleteBlock, setPendingDeleteBlock] = useState<StaffOfflineBlock | null>(null);
  const [deletingBlock, setDeletingBlock] = useState(false);
  const [hiddenStaffIds, setHiddenStaffIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>(lockedStaffId ? "solo" : "multi");
  const [integrateStaffOpen, setIntegrateStaffOpen] = useState(false);
  const [addBookingOpen, setAddBookingOpen] = useState(false);
  const [bookingPrefill, setBookingPrefill] = useState<{ staffId: string; date: string; fromTime: string } | null>(null);
  const [removeStaffTarget, setRemoveStaffTarget] = useState<StaffMember | null>(null);
  const [removingStaff, setRemovingStaff] = useState(false);

  const branchId = activeBranchId ?? "";
  const { dayStartMin, dayEndMin, slotMinutes } = useCalendarConfig(branchId || null);
  const nowState = useNowWithinRange(viewDate, dayStartMin, dayEndMin);

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
    setHiddenStaffIds(new Set());
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
      await removeOfflineBlock(pendingDeleteBlock.staffId, pendingDeleteBlock.id);
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

  const handleConfirmRemoveStaff = async () => {
    if (!removeStaffTarget || removingStaff) return;
    setRemovingStaff(true);
    const toastId = appToast.loading("Removing from calendar…");
    try {
      await removeAvailabilityForStaff(removeStaffTarget.id);
      appToast.dismiss(toastId);
      appToast.success(`${displayName(removeStaffTarget)} removed from the calendar`);
      if (focusedStaffId === removeStaffTarget.id) {
        setFocusedStaffId(null);
        setViewMode("multi");
      }
      setRemoveStaffTarget(null);
    } catch {
      appToast.dismiss(toastId);
      appToast.error("Could not remove this staff member. Please try again.");
    } finally {
      setRemovingStaff(false);
    }
  };

  // Build the Calendar's staff list directly from the Schedule API's own
  // records — a schedule's `staff` summary (id, fullName) is all we get, so
  // branchId/departmentId/role/slotDurationMin are synthesized rather than
  // looked up from a separate (and potentially out-of-sync) branch
  // StaffMember record. This guarantees "has a live schedule" and "shows on
  // the Calendar" can never disagree.
  const defaultSlotDurationMin = getActivePreset().slotDurationMin;
  const calendarStaff = useMemo<StaffMember[]>(() => {
    if (integratedStaffLoading) return [];
    const all = integratedSchedules
      .filter((s) => s.staff)
      .map((s): StaffMember => ({
        id: s.staff_id,
        branchId,
        departmentId: "",
        name: s.staff!.fullName,
        role: "Staff",
        email: s.staff!.email || undefined,
        active: true,
        hue: hueFromSeed(s.staff_id),
        slotDurationMin: defaultSlotDurationMin,
      }));
    if (lockedStaffId) return all.filter((s) => s.id === lockedStaffId);
    return all;
  }, [integratedSchedules, integratedStaffLoading, branchId, defaultSlotDurationMin, lockedStaffId]);

  const viewIsoForBookings = toIsoDate(viewDate);
  useEffect(() => {
    if (integratedStaffLoading || calendarStaff.length === 0) return;
    const branchName = branches.find((b) => b.id === branchId)?.name;
    void fetchStaffBookingsForCalendar({
      staffIds: calendarStaff.map((s) => s.id),
      dateIso: viewIsoForBookings,
      branchName,
    }).catch(() => {
      appToast.error("Couldn't load bookings for this day.");
    });
  }, [calendarStaff, integratedStaffLoading, viewIsoForBookings, branches, branchId]);

  const toggleStaffVisibility = (id: string) => {
    setHiddenStaffIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const displayStaff = useMemo(() => {
    if (focusedStaffId || viewMode === "solo") {
      const targetId = focusedStaffId ?? calendarStaff[0]?.id;
      const one = calendarStaff.find((s) => s.id === targetId);
      return one ? [one] : calendarStaff.slice(0, 1);
    }
    return calendarStaff.filter((s) => !hiddenStaffIds.has(s.id));
  }, [calendarStaff, focusedStaffId, viewMode, hiddenStaffIds]);

  const focusedStaff = focusedStaffId
    ? calendarStaff.find((s) => s.id === focusedStaffId)
    : null;

  const dayBookings = useMemo(
    () =>
      bookings.filter((b) => {
        // Bookings now come from /staff-bookings already scoped to exactly
        // the Calendar's staff + viewed date — the API response carries no
        // branchId, so filtering on it here would drop everything.
        if (deptId !== "all" && b.departmentId !== deptId) return false;
        if (b.status === "cancelled") return false;
        return bookingMatchesViewDate(b, viewDate);
      }),
    [bookings, deptId, viewDate],
  );

  const hourLabels = useMemo(
    () => generateHourLabels(dayStartMin, dayEndMin),
    [dayStartMin, dayEndMin],
  );

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

  // Stats for the header strip — real counts, no invented data.
  const activeDoctorCount = calendarStaff.length;
  const consultationsToday = useMemo(
    () => dayBookings.filter((b) => calendarStaff.some((s) => s.id === b.staffId)).length,
    [dayBookings, calendarStaff],
  );

  // Shared by the mobile timeline: why a given hour isn't bookable for a
  // staff member who has no booking/block item in it — same source of truth
  // (slotStateAtMinute/getLeaveOnDate) the desktop grid's shading uses, so
  // the two views can never disagree about what's blocked.
  const getUnavailableReason = (staffId: string, hourMin: number): "leave" | "unavailable" | undefined => {
    if (getLeaveOnDate(staffId, viewIso)) return "leave";
    const state = slotStateAtMinute(staffId, hourMin, viewDate, false);
    if (state === "unavailable") return "unavailable";
    return undefined;
  };

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

  if (integratedStaffLoading) {
    return (
      <div className="space-y-5">
        <SectionTitle title="Calendar" subtitle="Loading…" />
        <GlassCard>
          <div className="p-10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
          </div>
        </GlassCard>
      </div>
    );
  }

  if (!calendarStaff.length) {
    return (
      <div className="space-y-5">
        <SectionTitle title="Calendar" subtitle={`Add ${terms.staffPlural.toLowerCase()} in Staff & Departments to view calendars`} />
        <GlassCard>
          <div className="p-8 flex flex-col items-center text-center gap-3">
            <p className="text-sm text-slate-500">
              No {terms.staffPlural.toLowerCase()} in this {terms.department.toLowerCase()} yet.
            </p>
            {!readOnly && !lockedStaffId && (
              <button
                type="button"
                onClick={() => setIntegrateStaffOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium common-button-bg"
              >
                <UserPlus className="w-4 h-4" /> Integrate Staff
              </button>
            )}
          </div>
        </GlassCard>

        {!readOnly && !lockedStaffId && (
          <IntegrateStaffModal
            open={integrateStaffOpen}
            onClose={() => setIntegrateStaffOpen(false)}
            branchId={branchId}
            branches={branches}
            onIntegrated={() => {}}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-5">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-700/70 bg-gradient-to-br from-slate-50 via-white to-violet-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-violet-950/20 px-4 py-4 sm:px-5 sm:py-5 space-y-3">
        {/* Row 1: branch pill + title (left) / date nav (right) */}
        <div className="relative flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="min-w-0 space-y-3">
            {!lockedStaffId && <BranchSwitcher />}

            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {lockedStaffId && focusedStaff ? displayName(focusedStaff) : "Calendar"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {lockedStaffId
                  ? `Your ${terms.appointments.toLowerCase()} · ${slotMinutes}-min slots`
                  : `${activeDoctorCount} ${terms.staffPlural.toLowerCase()} active · ${consultationsToday} ${terms.appointments.toLowerCase()} today`}
              </p>
            </div>
          </div>

          <div className="lg:shrink-0">
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
          </div>
        </div>

        {/* Row 2: visible-staff chips (left) / action buttons (right), same row */}
        {!lockedStaffId && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
            {viewMode === "multi" && calendarStaff.length > 0 ? (
              <div className="min-w-0 flex-1 -mx-1 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex items-center gap-1.5 px-1 pb-0.5 min-w-min">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 shrink-0 mr-0.5 flex items-center gap-1">
                    <UserPlus className="w-3 h-3" />
                    Visible Staff:
                  </span>
                  {calendarStaff.map((s) => {
                    const visible = !hiddenStaffIds.has(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleStaffVisibility(s.id)}
                        className="shrink-0 inline-flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-full text-xs font-medium border transition-all whitespace-nowrap"
                        style={
                          visible
                            ? {
                                background: `hsl(${s.hue}, 75%, 96%)`,
                                borderColor: `hsl(${s.hue}, 60%, 80%)`,
                                color: `hsl(${s.hue}, 60%, 32%)`,
                              }
                            : undefined
                        }
                        data-hidden={!visible}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: visible ? `hsl(${s.hue}, 65%, 50%)` : "#cbd5e1" }}
                        />
                        {displayName(s)}
                        {visible && <X className="w-3 h-3 opacity-50" />}
                      </button>
                    );
                  })}
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => setIntegrateStaffOpen(true)}
                      className="shrink-0 inline-flex items-center gap-1 pl-1.5 pr-2 py-1 rounded-full text-xs font-medium border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-violet-300 hover:text-violet-600 dark:hover:text-violet-300 transition-colors whitespace-nowrap"
                    >
                      <UserPlus className="w-3 h-3" />
                      Add Staff
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="hidden sm:block flex-1" />
            )}

            {!readOnly && (
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setIntegrateStaffOpen(true)}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-violet-600 text-white shadow-sm shadow-violet-600/20 hover:bg-violet-700 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Integrate Staff
                </button>
                <button
                  type="button"
                  onClick={() => setAddBookingOpen(true)}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-white shadow-sm hover:bg-slate-900 transition-colors"
                >
                  <CalendarPlus className="w-3.5 h-3.5" /> Add Booking
                </button>
              </div>
            )}
          </div>
        )}
      </div>

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
            <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto flex-wrap">
              {!readOnly && (
                <>
                  <button
                    type="button"
                    onClick={() => setScheduleStaff(focusedStaff)}
                    className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 hover:bg-violet-50 dark:hover:bg-violet-900/30 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-700 dark:hover:text-violet-300 transition-colors shrink-0"
                  >
                    <Pencil className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setRemoveStaffTarget(focusedStaff)}
                    className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 bg-white/80 dark:bg-slate-800/80 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors shrink-0"
                    title={`Remove ${displayName(focusedStaff)} from calendar`}
                  >
                    <Trash2 className="w-3 h-3" />
                    Remove
                  </button>
                </>
              )}
              <div className={calendarToolbarShellClass()}>
                <button
                  type="button"
                  onClick={() => setShareStaff(focusedStaff)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-left common-button-bg h-full"
                >
                  <Share2 className="w-4 h-4 flex-shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold leading-tight">Share</span>

                  </span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFocusedStaffId(null);
                  setViewMode("multi");
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
                Show all
              </button>
            </div>
          </div>
        )}

        {/* Card-based schedule, shared by every breakpoint: a sticky hour
            axis plus a horizontally-scrollable, snap-aligned row of staff
            columns — swipe/scroll sideways for the next staff member. */}
        <CalendarMobileTimeline
          staff={displayStaff}
          staffBookings={staffBookings}
          staffOfflineBlocks={staffOfflineBlocks}
          hourLabels={hourLabels}
          dayStartMin={dayStartMin}
          dayEndMin={dayEndMin}
          nowMin={nowState?.nowMin ?? null}
          getUnavailableReason={getUnavailableReason}
          onBookSlot={
            readOnly
              ? undefined
              : (staffId, hourMin) => {
                  setBookingPrefill({
                    staffId,
                    date: toIsoDate(viewDate),
                    fromTime: minutesToTimeInput(hourMin),
                  });
                  setAddBookingOpen(true);
                }
          }
          onEditStaff={readOnly ? undefined : setScheduleStaff}
          onViewStaff={
            lockedStaffId
              ? undefined
              : (s) => {
                  setFocusedStaffId(s.id);
                  setViewMode("solo");
                }
          }
          onBookingClick={setSelectedBooking}
          onBlockClick={setSelectedOfflineBlock}
        />
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
        <RemoveStaffModal
          open={Boolean(removeStaffTarget)}
          staffMember={removeStaffTarget}
          staffName={removeStaffTarget ? displayName(removeStaffTarget) : ""}
          onClose={() => !removingStaff && setRemoveStaffTarget(null)}
          onConfirm={handleConfirmRemoveStaff}
          removing={removingStaff}
        />
      )}

      {!readOnly && (
        <StaffScheduleModal
          open={Boolean(scheduleStaff)}
          staffId={scheduleStaff?.id ?? null}
          staffName={scheduleStaff ? displayName(scheduleStaff) : ""}
          onClose={() => setScheduleStaff(null)}
          onRemoved={() => {
            if (scheduleStaff && focusedStaffId === scheduleStaff.id) {
              setFocusedStaffId(null);
              setViewMode("multi");
            }
            setScheduleStaff(null);
          }}
        />
      )}

      {!readOnly && !lockedStaffId && (
        <ShareDoctorCalendarModal
          open={Boolean(shareStaff)}
          staff={shareStaff}
          onClose={() => setShareStaff(null)}
        />
      )}

      {!readOnly && !lockedStaffId && (
        <IntegrateStaffModal
          open={integrateStaffOpen}
          onClose={() => setIntegrateStaffOpen(false)}
          branchId={branchId}
          branches={branches}
          onIntegrated={() => {}}
        />
      )}

      {!readOnly && (
        <AddBookingModal
          open={addBookingOpen}
          onClose={() => {
            setAddBookingOpen(false);
            setBookingPrefill(null);
          }}
          branches={branches}
          defaultBranchId={branchId}
          prefill={bookingPrefill ?? undefined}
        />
      )}
    </div>
  );
};

export default CalendarView;
