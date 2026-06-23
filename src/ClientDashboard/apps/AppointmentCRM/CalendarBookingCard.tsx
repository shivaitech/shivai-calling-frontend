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
  onClick: () => void;
}

const CalendarBookingCard = ({ booking, dayStartMin, dayEndMin, onClick }: CalendarBookingCardProps) => {
  const startMin = getBookingStartMinutes(booking);
  const duration = getBookingDuration(booking);
  if (startMin < dayStartMin || startMin >= dayEndMin) return null;

  const top = minutesToTopPx(startMin, dayStartMin);
  const height = durationToHeightPx(duration);
  const timeLabel = formatTimeRangeCompact(startMin, duration);
  const status = bookingStatusMeta(booking.status);
  const consultantType = booking.appointmentType || booking.service;
  const compact = height < CALENDAR_SLOT_HEIGHT_PX * 2;
  const medium = height < CALENDAR_SLOT_HEIGHT_PX * 4;
  const showStatus = height >= CALENDAR_SLOT_HEIGHT_PX * 5;

  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute left-px right-px z-10 group text-left rounded-[3px] overflow-hidden border border-violet-300/70 dark:border-violet-600/50 bg-violet-100/90 dark:bg-violet-950/50 hover:bg-violet-200/90 dark:hover:bg-violet-900/60 hover:z-20 transition-colors shadow-sm"
      style={{ top, height: Math.max(height - 1, 14) }}
      title={`${booking.customer} · ${consultantType} · ${timeLabel}`}
    >
      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-violet-600 dark:bg-violet-400" />
      <div className={`h-full flex min-h-0 ${compact ? "items-center px-1.5 py-0" : "flex-col justify-between px-1.5 py-0.5"}`}>
        {compact ? (
          <p className="text-[9px] font-semibold text-violet-950 dark:text-violet-100 leading-tight truncate w-full">
            {booking.customer}
          </p>
        ) : (
          <>
            {!medium && (
              <p className="text-[8px] font-semibold text-violet-700 dark:text-violet-300 leading-none tabular-nums shrink-0 truncate">
                {timeLabel}
              </p>
            )}
            <div className={`min-h-0 ${medium ? "flex flex-col justify-center gap-0" : "flex-1 flex flex-col justify-center gap-0"}`}>
              <p className={`font-semibold text-violet-950 dark:text-violet-50 leading-tight truncate ${medium ? "text-[9px]" : "text-[10px]"}`}>
                {booking.customer}
              </p>
              {!medium && (
                <p className="text-[8px] text-violet-700/80 dark:text-violet-300/80 leading-tight truncate">
                  {consultantType}
                </p>
              )}
            </div>
            {showStatus && (
              <span className={`self-start text-[7px] px-1 py-px rounded font-medium border shrink-0 leading-none ${status.cls}`}>
                {status.label}
              </span>
            )}
          </>
        )}
      </div>
    </button>
  );
};

export default CalendarBookingCard;
