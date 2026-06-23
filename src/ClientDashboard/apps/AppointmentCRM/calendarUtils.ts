import type { Booking } from "./mockData";

export const CALENDAR_SLOT_MINUTES = 15;
export const CALENDAR_DAY_START_MIN = 9 * 60;
export const CALENDAR_DAY_END_MIN = 17 * 60;
/** ~48px per hour — Google Calendar–style density (was 42px per 15 min). */
export const CALENDAR_SLOT_HEIGHT_PX = 12;

/** Parse "09:30 AM", "14:15", "09:00" → minutes from midnight. */
export function parseTimeToMinutes(time: string): number {
  const t = time.trim();
  const ampmMatch = t.match(/\s*(AM|PM)\s*$/i);
  const core = t.replace(/\s*(AM|PM)\s*$/i, "").trim();
  const [hStr, mStr] = core.split(":");
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr ?? "0", 10);
  if (ampmMatch) {
    const p = ampmMatch[1].toUpperCase();
    if (p === "PM" && h !== 12) h += 12;
    if (p === "AM" && h === 12) h = 0;
  }
  return h * 60 + m;
}

export function formatMinutesLabel(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  if (m === 0) return `${h12}:00 ${period}`;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

/** Single-line axis label: "9 AM", "9:30 AM". */
export function formatAxisTimeCompact(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  if (m === 0) return `${h12} ${period}`;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

export function formatTimeRange(startMin: number, durationMin: number): string {
  return `${formatMinutesLabel(startMin)} – ${formatMinutesLabel(startMin + durationMin)}`;
}

export function formatTimeRangeCompact(startMin: number, durationMin: number): string {
  const start = formatMinutesLabel(startMin);
  const end = formatMinutesLabel(startMin + durationMin);
  const startParts = start.split(" ");
  const endParts = end.split(" ");
  if (startParts[1] === endParts[1]) {
    return `${startParts[0]} – ${endParts[0]} ${endParts[1]}`;
  }
  return `${start} – ${end}`;
}

export function generateDaySlots(
  startMin = CALENDAR_DAY_START_MIN,
  endMin = CALENDAR_DAY_END_MIN,
  slotMinutes = CALENDAR_SLOT_MINUTES,
): number[] {
  const slots: number[] = [];
  for (let m = startMin; m < endMin; m += slotMinutes) {
    slots.push(m);
  }
  return slots;
}

export function generateHourLabels(
  startMin = CALENDAR_DAY_START_MIN,
  endMin = CALENDAR_DAY_END_MIN,
): number[] {
  const hours: number[] = [];
  const firstHour = Math.ceil(startMin / 60) * 60;
  if (startMin % 60 !== 0 && startMin < firstHour) {
    hours.push(startMin);
  }
  for (let m = firstHour || startMin; m < endMin; m += 60) {
    hours.push(m);
  }
  return hours;
}

export function minutesToTopPx(minutes: number, dayStart = CALENDAR_DAY_START_MIN): number {
  return ((minutes - dayStart) / CALENDAR_SLOT_MINUTES) * CALENDAR_SLOT_HEIGHT_PX;
}

export function durationToHeightPx(durationMin: number): number {
  return (durationMin / CALENDAR_SLOT_MINUTES) * CALENDAR_SLOT_HEIGHT_PX;
}

export function totalCalendarHeightPx(
  startMin = CALENDAR_DAY_START_MIN,
  endMin = CALENDAR_DAY_END_MIN,
): number {
  return ((endMin - startMin) / CALENDAR_SLOT_MINUTES) * CALENDAR_SLOT_HEIGHT_PX;
}

export function getBookingStartMinutes(booking: Booking): number {
  return parseTimeToMinutes(booking.time);
}

export function getBookingDuration(booking: Booking): number {
  return booking.durationMin ?? 30;
}

export function formatBookingTimeRange(booking: Booking): string {
  return formatTimeRange(getBookingStartMinutes(booking), getBookingDuration(booking));
}

export function bookingOverlapsSlot(
  booking: Booking,
  slotStartMin: number,
  slotMinutes = CALENDAR_SLOT_MINUTES,
): boolean {
  const bStart = getBookingStartMinutes(booking);
  const bEnd = bStart + getBookingDuration(booking);
  const slotEnd = slotStartMin + slotMinutes;
  return bStart < slotEnd && bEnd > slotStartMin;
}
