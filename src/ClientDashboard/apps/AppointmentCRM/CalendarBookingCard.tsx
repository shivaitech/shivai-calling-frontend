import type { Booking } from "./mockData";
import { bookingStatusMeta } from "./mockData";
import {
  CALENDAR_SLOT_HEIGHT_PX,
  formatTimeRangeCompact,
  getBookingDuration,
  getBookingStartMinutes,
  durationToHeightPx,
  minutesToTopPx,
} from "./calendarUtils";

interface CalendarBookingCardProps {
  booking: Booking;
  dayStartMin: number;
  dayEndMin: number;
  /** Provider's color hue — ties the card visually to its staff column/chip. */
  hue: number;
  onClick: () => void;
}

const CalendarBookingCard = ({ booking, dayStartMin, dayEndMin, hue, onClick }: CalendarBookingCardProps) => {
  const startMin = getBookingStartMinutes(booking);
  const duration = getBookingDuration(booking);
  if (startMin < dayStartMin || startMin >= dayEndMin) return null;

  const top = minutesToTopPx(startMin, dayStartMin);
  const height = durationToHeightPx(duration);
  const timeLabel = formatTimeRangeCompact(startMin, duration);
  const status = bookingStatusMeta(booking.status);
  const consultantType = booking.appointmentType || booking.service;
  // A walk-in that's still pending reads as an unplanned, time-sensitive slot —
  // the closest real-data signal to "urgent" without inventing a new field.
  const isUrgent = booking.channel === "walk-in" && booking.status === "pending";
  const compact = height < CALENDAR_SLOT_HEIGHT_PX * 2;
  const medium = height < CALENDAR_SLOT_HEIGHT_PX * 3.5;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute left-px right-px z-10 group text-left rounded-md overflow-hidden border hover:z-20 hover:shadow-md transition-all shadow-sm ${
        isUrgent
          ? "border-rose-300 dark:border-rose-700/60 bg-rose-50/95 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50"
          : "border-slate-200 dark:border-slate-700/70 bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-800"
      }`}
      style={{ top, height: Math.max(height - 1, 14) }}
      title={`${booking.customer} · ${consultantType} · ${timeLabel}`}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ background: isUrgent ? "#e11d48" : `hsl(${hue}, 65%, 50%)` }}
      />
      <div className={`h-full flex min-h-0 ${compact ? "items-center px-2 py-0 gap-1.5" : "flex-col px-2 py-1"}`}>
        {compact ? (
          <>
            <p className="text-[9px] font-semibold text-slate-800 dark:text-white leading-tight truncate flex-1">
              {booking.customer}
            </p>
            {isUrgent && (
              <span className="text-[7px] px-1 py-px rounded font-bold shrink-0 leading-none bg-rose-600 text-white uppercase tracking-wide">
                Urgent
              </span>
            )}
          </>
        ) : (
          <>
            <div className="flex items-start justify-between gap-1">
              <p className={`font-semibold text-slate-800 dark:text-white leading-tight truncate ${medium ? "text-[9.5px]" : "text-[11px]"}`}>
                {booking.customer}
              </p>
              <span
                className={`shrink-0 text-[7px] px-1.5 py-px rounded-full font-bold leading-none uppercase tracking-wide ${
                  isUrgent ? "bg-rose-600 text-white" : status.cls
                }`}
              >
                {isUrgent ? "Urgent" : status.label}
              </span>
            </div>
            {!medium && (
              <p className="text-[8.5px] text-slate-500 dark:text-slate-400 leading-tight truncate mt-0.5">
                {consultantType}
              </p>
            )}
            {!medium && (
              <p className="text-[8px] font-medium text-slate-400 dark:text-slate-500 leading-none tabular-nums mt-auto pt-0.5">
                {timeLabel}
              </p>
            )}
          </>
        )}
      </div>
    </button>
  );
};

export default CalendarBookingCard;
