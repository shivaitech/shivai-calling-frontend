import { Ban, Clock, Eye, Pencil, Plus } from "lucide-react";
import type { StaffMember } from "./staffStore";
import type { Booking } from "./mockData";
import { bookingStatusMeta } from "./mockData";
import type { StaffOfflineBlock } from "./offlineBlocksStore";
import { blockTypeLabel, getBlockStartMinutes, getBlockDurationMinutes } from "./offlineBlocksStore";
import {
  formatAxisTimeCompact,
  formatTimeRangeCompact,
  getBookingStartMinutes,
  getBookingDuration,
} from "./calendarUtils";

type TimelineItem =
  | { kind: "booking"; startMin: number; durationMin: number; booking: Booking }
  | { kind: "block"; startMin: number; durationMin: number; block: StaffOfflineBlock };

interface Props {
  staff: StaffMember[];
  staffBookings: Map<string, Booking[]>;
  staffOfflineBlocks: Map<string, StaffOfflineBlock[]>;
  hourLabels: number[];
  dayStartMin: number;
  dayEndMin: number;
  nowMin: number | null;
  /** Per-hour "why is this staff member unavailable" check — leave/off-hours
   * must stay visible here exactly as on the desktop grid, never silently
   * implying a blocked hour is bookable. Returns undefined when the hour is
   * normally available for that staff member. */
  getUnavailableReason: (staffId: string, hourMin: number) => "leave" | "unavailable" | undefined;
  /** Omit to disable tap-to-book (e.g. read-only views). */
  onBookSlot?: (staffId: string, hourMin: number) => void;
  /** Omit to hide the per-column "Edit hours" button (e.g. read-only views). */
  onEditStaff?: (staff: StaffMember) => void;
  /** Omit to hide the per-column "View solo" button. */
  onViewStaff?: (staff: StaffMember) => void;
  onBookingClick: (booking: Booking) => void;
  onBlockClick: (block: StaffOfflineBlock) => void;
}

const REASON_LABEL: Record<"leave" | "unavailable", string> = {
  leave: "On leave",
  unavailable: "Off hours",
};

const REASON_CLS: Record<"leave" | "unavailable", string> = {
  leave: "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-200/70 dark:border-red-900/50",
  unavailable: "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700",
};

/** Floor so a column never gets too narrow to read — below this, columns
 * stay fixed-width and the row scrolls horizontally instead of squeezing
 * further. Above it, columns stretch evenly to fill the available width
 * (one staff = full width, two = half each, and so on). */
const MIN_COL_WIDTH = 240;
const AXIS_WIDTH = 56;

/** Card-based scheduling view used at every breakpoint: one shared, sticky
 * hour axis on the left, and a horizontally-scrollable, snap-aligned row of
 * per-staff columns on the right — swipe/scroll sideways for the next staff
 * member instead of the old pixel-positioned desktop grid or a vertical
 * stack of staff sections. Each column's own hour cells line up against the
 * shared axis so "10 AM" means the same row for every staff member. */
const CalendarMobileTimeline = ({
  staff,
  staffBookings,
  staffOfflineBlocks,
  hourLabels,
  dayStartMin,
  dayEndMin,
  nowMin,
  getUnavailableReason,
  onBookSlot,
  onEditStaff,
  onViewStaff,
  onBookingClick,
  onBlockClick,
}: Props) => {
  if (hourLabels.length === 0) {
    return (
      <div className="px-3 py-8 text-center text-sm text-slate-400">
        No hours to show for this {dayEndMin <= dayStartMin ? "day" : "range"}.
      </div>
    );
  }

  return (
    <div className="flex">
      {/* Shared hour axis — sticky so it stays put while columns scroll past it. */}
      <div className="sticky left-0 z-20 flex-shrink-0 bg-white dark:bg-slate-900 border-r-2 border-slate-200 dark:border-slate-700" style={{ width: AXIS_WIDTH }}>
        <div className="h-[49px] border-b border-slate-200 dark:border-slate-700" />
        {hourLabels.map((hourMin, idx) => {
          const isCurrentHour = nowMin !== null && nowMin >= hourMin && nowMin < hourMin + 60;
          return (
            <div
              key={hourMin}
              className={`px-1.5 py-3 border-b border-slate-200 dark:border-slate-700 flex items-start justify-center ${
                isCurrentHour
                  ? "bg-red-50/40 dark:bg-red-950/15"
                  : idx % 2 === 1
                    ? "bg-slate-50/70 dark:bg-slate-800/30"
                    : ""
              }`}
            >
              <span
                className={`text-[10.5px] font-semibold tabular-nums whitespace-nowrap ${
                  isCurrentHour ? "text-red-500" : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {formatAxisTimeCompact(hourMin)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Staff columns — stretch to fill the row when there are few (one
          staff = full width, two = half each, …); once a column would drop
          below MIN_COL_WIDTH, columns switch to a fixed width and the row
          scrolls horizontally, snap one at a time on narrow screens. */}
      <div className="flex-1 min-w-0 overflow-x-auto overscroll-x-contain snap-x snap-mandatory [-webkit-overflow-scrolling:touch]">
        <div className="flex">
          {staff.map((s) => (
            <StaffColumn
              key={s.id}
              staff={s}
              colBasis={`max(${MIN_COL_WIDTH}px, ${100 / staff.length}%)`}
              bookings={staffBookings.get(s.id) ?? []}
              blocks={staffOfflineBlocks.get(s.id) ?? []}
              hourLabels={hourLabels}
              nowMin={nowMin}
              getUnavailableReason={getUnavailableReason}
              onBookSlot={onBookSlot}
              onEditStaff={onEditStaff}
              onViewStaff={onViewStaff}
              onBookingClick={onBookingClick}
              onBlockClick={onBlockClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const StaffColumn = ({
  staff,
  colBasis,
  bookings,
  blocks,
  hourLabels,
  nowMin,
  getUnavailableReason,
  onBookSlot,
  onEditStaff,
  onViewStaff,
  onBookingClick,
  onBlockClick,
}: {
  staff: StaffMember;
  /** CSS width value (e.g. "max(240px, 50%)") — full width for one staff,
   * an even share for a few, a fixed floor once there are many. */
  colBasis: string;
  bookings: Booking[];
  blocks: StaffOfflineBlock[];
  hourLabels: number[];
  nowMin: number | null;
  getUnavailableReason: (staffId: string, hourMin: number) => "leave" | "unavailable" | undefined;
  onBookSlot?: (staffId: string, hourMin: number) => void;
  onEditStaff?: (staff: StaffMember) => void;
  onViewStaff?: (staff: StaffMember) => void;
  onBookingClick: (booking: Booking) => void;
  onBlockClick: (block: StaffOfflineBlock) => void;
}) => {
  const items: TimelineItem[] = [
    ...bookings.map((booking): TimelineItem => ({
      kind: "booking",
      startMin: getBookingStartMinutes(booking),
      durationMin: getBookingDuration(booking),
      booking,
    })),
    ...blocks.map((block): TimelineItem => ({
      kind: "block",
      startMin: getBlockStartMinutes(block),
      durationMin: getBlockDurationMinutes(block),
      block,
    })),
  ].sort((a, b) => a.startMin - b.startMin);

  return (
    <div
      className="flex-shrink-0 snap-start border-r-2 border-slate-200 dark:border-slate-700 last:border-r-0"
      style={{ width: colBasis }}
    >
      <div
        className="sticky top-0 z-10 flex items-center gap-2 px-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-100 dark:border-slate-800"
        style={{ height: 49 }}
      >
        <div
          className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[11px] font-bold"
          style={{ background: `linear-gradient(135deg, hsl(${staff.hue},70%,55%), hsl(${staff.hue + 20},65%,45%))` }}
        >
          {staff.name.charAt(0)}
        </div>
        <p className="text-[13px] font-semibold text-slate-800 dark:text-white truncate min-w-0">{staff.name}</p>
        <span className="ml-auto text-[10px] text-slate-400 shrink-0">{bookings.length} Pts</span>
        {onViewStaff && (
          <button
            type="button"
            onClick={() => onViewStaff(staff)}
            className="shrink-0 p-1 rounded-md text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/30 dark:hover:text-violet-300 transition-colors"
            title={`View only ${staff.name}`}
            aria-label={`View only ${staff.name}`}
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        )}
        {onEditStaff && (
          <button
            type="button"
            onClick={() => onEditStaff(staff)}
            className="shrink-0 p-1 rounded-md text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/30 dark:hover:text-violet-300 transition-colors"
            title={`Edit ${staff.name} hours & bookings`}
            aria-label={`Edit ${staff.name} hours & bookings`}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {hourLabels.map((hourMin, idx) => {
        const hourItems = items.filter((it) => it.startMin >= hourMin && it.startMin < hourMin + 60);
        const reason = hourItems.length === 0 ? getUnavailableReason(staff.id, hourMin) : undefined;
        const isCurrentHour = nowMin !== null && nowMin >= hourMin && nowMin < hourMin + 60;
        // An hour that's fully elapsed today isn't bookable — don't invite a
        // tap on "+ Book" for a slot that's already gone.
        const isPastHour = nowMin !== null && hourMin + 60 <= nowMin;
        return (
          <div
            key={hourMin}
            className={`px-2.5 py-3 border-b border-slate-200 dark:border-slate-700 space-y-2 ${
              isCurrentHour
                ? "bg-red-50/40 dark:bg-red-950/15"
                : idx % 2 === 1
                  ? "bg-slate-50/70 dark:bg-slate-800/30"
                  : ""
            }`}
          >
            {hourItems.length === 0 && !reason && (
              isPastHour ? (
                <div className="h-9 flex items-center justify-center rounded-lg bg-slate-100/60 dark:bg-slate-800/40">
                  <span className="text-[11px] text-slate-300 dark:text-slate-600">Time passed</span>
                </div>
              ) : onBookSlot ? (
                <button
                  type="button"
                  onClick={() => onBookSlot(staff.id, hourMin)}
                  className="w-full flex items-center justify-center gap-1 h-9 rounded-lg border border-dashed border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-300 text-[11px] font-medium hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Book
                </button>
              ) : (
                <div className="h-5 flex items-center">
                  <span className="text-[11px] text-slate-300 dark:text-slate-600">No bookings</span>
                </div>
              )
            )}
            {hourItems.map((item) =>
              item.kind === "booking" ? (
                <MobileBookingCard
                  key={item.booking.id}
                  booking={item.booking}
                  onClick={() => onBookingClick(item.booking)}
                />
              ) : (
                <MobileBlockCard
                  key={item.block.id}
                  block={item.block}
                  onClick={() => onBlockClick(item.block)}
                />
              ),
            )}
            {reason && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium border ${REASON_CLS[reason]}`}
              >
                {REASON_LABEL[reason]}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

const MobileBookingCard = ({ booking, onClick }: { booking: Booking; onClick: () => void }) => {
  const status = bookingStatusMeta(booking.status);
  const startMin = getBookingStartMinutes(booking);
  const duration = getBookingDuration(booking);
  const timeLabel = formatTimeRangeCompact(startMin, duration);
  const consultantType = booking.appointmentType || booking.service;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 overflow-hidden shadow-sm active:scale-[0.99] transition-transform"
      style={{ minHeight: 44 }}
    >
      <div className="flex">
        <div className="w-1 flex-shrink-0 bg-violet-500" />
        <div className="flex-1 min-w-0 px-3 py-2.5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[13px] font-semibold text-slate-800 dark:text-white leading-tight truncate">
              {booking.customer}
            </p>
            <span className={`shrink-0 text-[9px] px-2 py-0.5 rounded-full font-bold leading-none uppercase tracking-wide ${status.cls}`}>
              {status.label}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <Clock className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-tight tabular-nums truncate">
              {timeLabel}
            </p>
            {consultantType && (
              <>
                <span className="text-slate-300 dark:text-slate-600">·</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight truncate">
                  {consultantType}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};

const MobileBlockCard = ({ block, onClick }: { block: StaffOfflineBlock; onClick: () => void }) => {
  const startMin = getBlockStartMinutes(block);
  const duration = getBlockDurationMinutes(block);
  const timeLabel = formatTimeRangeCompact(startMin, duration);
  const label = blockTypeLabel(block);
  const isManual = block.type === "manual_booking";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl border overflow-hidden active:scale-[0.99] transition-transform ${
        isManual
          ? "border-amber-300/70 dark:border-amber-600/50 bg-amber-50/80 dark:bg-amber-950/40"
          : "border-slate-200 dark:border-slate-600/50 bg-slate-100/70 dark:bg-slate-700/50"
      }`}
      style={{ minHeight: 44 }}
    >
      <div className="px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-200 leading-tight truncate">
            {isManual ? block.patientName || "Manual booking" : label}
          </p>
          <Ban className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        </div>
        <div className="flex items-center gap-1 mt-1">
          <Clock className="w-3 h-3 text-slate-400 flex-shrink-0" />
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight tabular-nums">
            {timeLabel}
          </p>
        </div>
      </div>
    </button>
  );
};

export default CalendarMobileTimeline;
