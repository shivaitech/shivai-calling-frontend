import { useEffect, useMemo, useState } from "react";
import { Clock } from "lucide-react";
import CalendarDateNav from "./CalendarDateNav";
import type { DoctorCalendarSnapshot } from "./doctorCalendarShareStore";
import { fetchDoctorCalendarDayWithJwt } from "./doctorCalendarShareAPI";
import { toIsoDate } from "./availabilityStore";
import type { CalendarCellState } from "./availabilityStore";
import {
  isMinuteInDailyBreak,
  isMinuteInWeeklyAvailability,
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
import { offlineBlockOverlapsSlot } from "./offlineBlocksStore";
import { bookingMatchesViewDate } from "./bookingsStore";
import CalendarBookingCard from "./CalendarBookingCard";
import CalendarOfflineBlockCard from "./CalendarOfflineBlockCard";
import { staffDisplayName, staffRoleLine } from "./staffStore";

const SLOT_BG: Record<CalendarCellState, string> = {
  available: "bg-white dark:bg-slate-800",
  booking: "bg-white dark:bg-slate-800",
  offline: "bg-amber-50/50 dark:bg-amber-950/10",
  break: "bg-[repeating-linear-gradient(-45deg,transparent,transparent_3px,rgb(186_230_253/0.45)_3px,rgb(186_230_253/0.45)_6px)]",
  leave: "bg-red-50/60 dark:bg-red-950/15",
  unavailable: "bg-slate-100/80 dark:bg-slate-800/60",
};

const TIME_AXIS_WIDTH = 48;

interface Props {
  snapshot: DoctorCalendarSnapshot;
  readOnly?: boolean;
  shareToken?: string;
  useJwtApi?: boolean;
}

function slotState(
  snapshot: DoctorCalendarSnapshot,
  viewDate: Date,
  minuteOfDay: number,
  hasBooking: boolean,
  hasOffline: boolean,
): CalendarCellState {
  if (hasBooking) return "booking";
  const iso = toIsoDate(viewDate);
  const offline = snapshot.offlineBlocks.find((b) => {
    if (b.date !== iso) return false;
    const start = parseInt(b.fromTime.split(":")[0], 10) * 60 + parseInt(b.fromTime.split(":")[1] ?? "0", 10);
    const end = parseInt(b.toTime.split(":")[0], 10) * 60 + parseInt(b.toTime.split(":")[1] ?? "0", 10);
    return minuteOfDay >= start && minuteOfDay < end;
  });
  if (offline?.type === "manual_booking") return "offline";
  if (offline?.type === "break") return "break";
  if (offline?.type === "unavailable") return "unavailable";
  if (snapshot.leaves.some((l) => l.fromDate <= iso && l.toDate >= iso)) {
    return "leave";
  }
  if (isMinuteInDailyBreak(snapshot.availability, viewDate, minuteOfDay)) return "break";
  if (!isMinuteInWeeklyAvailability(snapshot.availability, viewDate, minuteOfDay)) return "unavailable";
  return "available";
}

const DoctorPublicCalendar = ({ snapshot: initialSnapshot, shareToken, useJwtApi }: Props) => {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [viewDate, setViewDate] = useState(() => new Date());

  useEffect(() => {
    setSnapshot(initialSnapshot);
  }, [initialSnapshot]);

  useEffect(() => {
    if (!shareToken || !useJwtApi) return;
    const iso = toIsoDate(viewDate);
    let cancelled = false;
    (async () => {
      const day = await fetchDoctorCalendarDayWithJwt(shareToken, iso);
      if (cancelled || !day) return;
      setSnapshot((prev) => ({
        ...prev,
        staff: day.staff ?? prev.staff,
        branchId: day.branchId ?? prev.branchId,
        bookings: day.bookings ?? prev.bookings,
        offlineBlocks: day.offlineBlocks ?? prev.offlineBlocks,
        availability: day.availability ?? prev.availability,
        leaves: day.leaves ?? prev.leaves,
        syncedAt: day.syncedAt ?? prev.syncedAt,
      }));
    })();
    return () => {
      cancelled = true;
    };
  }, [shareToken, useJwtApi, viewDate]);
  const staff = snapshot.staff;
  const name = staffDisplayName(staff);
  const viewIso = toIsoDate(viewDate);
  const { dayStartMin, dayEndMin, slotMinutes } = useCalendarConfig(snapshot.branchId);

  const dayBookings = useMemo(
    () => snapshot.bookings.filter((b) => b.status !== "cancelled" && bookingMatchesViewDate(b, viewDate)),
    [snapshot.bookings, viewDate],
  );
  const dayOffline = useMemo(
    () => snapshot.offlineBlocks.filter((b) => b.date === viewIso),
    [snapshot.offlineBlocks, viewIso],
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
  const onLeave = snapshot.leaves.some((l) => l.fromDate <= viewIso && l.toDate >= viewIso);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-sm font-semibold text-slate-900 dark:text-white">{name}</h1>
          <p className="text-[10px] text-slate-500">{snapshot.companyName} · {snapshot.branchName}</p>
        </div>
        <CalendarDateNav
          viewDate={viewDate}
          onViewDateChange={(date) => setViewDate(new Date(date))}
          compact
        />
      </div>

      <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800">
        <div
          className="grid border-b border-slate-200 dark:border-slate-700"
          style={{ gridTemplateColumns: `${TIME_AXIS_WIDTH}px 1fr` }}
        >
          <div className="flex items-center justify-center py-1.5 border-r border-slate-200 dark:border-slate-700">
            <Clock className="w-3 h-3 text-slate-400" />
          </div>
          <div className={`px-2 py-1.5 text-center ${onLeave ? "bg-red-50/50 dark:bg-red-950/20" : ""}`}>
            <p className="text-[11px] font-semibold truncate">{name}</p>
            <p className="text-[9px] text-slate-500">{onLeave ? "On leave" : staffRoleLine(staff)}</p>
          </div>
        </div>

        <div className="flex">
          <div className="relative border-r border-slate-200 dark:border-slate-700 flex-shrink-0" style={{ width: TIME_AXIS_WIDTH, height: gridHeight }}>
            {hourLabels.map((mins) => (
              <div key={mins} className="absolute right-1 -translate-y-1/2" style={{ top: minutesToTopPx(mins, dayStartMin) }}>
                <span className="text-[9px] text-slate-500 tabular-nums">{formatAxisTimeCompact(mins)}</span>
              </div>
            ))}
          </div>

          <div className="flex-1 relative" style={{ height: gridHeight, minWidth: 0 }}>
            {hourLabels.map((mins) => (
              <div key={mins} className="absolute left-0 right-0 border-t border-slate-200 dark:border-slate-700 pointer-events-none" style={{ top: minutesToTopPx(mins, dayStartMin) }} />
            ))}
            {halfHourLabels.map((mins) => (
              <div key={mins} className="absolute left-0 right-0 border-t border-dotted border-slate-100 dark:border-slate-700/60 pointer-events-none" style={{ top: minutesToTopPx(mins, dayStartMin) }} />
            ))}

            {timeSlots.map((slotMin) => {
              const hasBooking = dayBookings.some((b) => bookingOverlapsSlot(b, slotMin));
              const hasOffline = dayOffline.some((o) => offlineBlockOverlapsSlot(o, slotMin));
              const state = slotState(snapshot, viewDate, slotMin, hasBooking, hasOffline);
              if (state === "booking" || hasOffline) return null;
              return (
                <div
                  key={slotMin}
                  className={`absolute left-0 right-0 ${SLOT_BG[state]}`}
                  style={{ top: minutesToTopPx(slotMin, dayStartMin), height: CALENDAR_SLOT_HEIGHT_PX }}
                />
              );
            })}

            {dayOffline.map((block) => (
              <CalendarOfflineBlockCard
                key={block.id}
                block={block}
                dayStartMin={dayStartMin}
                dayEndMin={dayEndMin}
                onClick={() => {}}
              />
            ))}

            {dayBookings.map((booking) => (
              <CalendarBookingCard
                key={booking.id}
                booking={booking}
                dayStartMin={dayStartMin}
                dayEndMin={dayEndMin}
                onClick={() => {}}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorPublicCalendar;
