import { useEffect, useState } from "react";
import { getOfflineBlockAtMinute, removeOfflineBlocksForStaff } from "./offlineBlocksStore";

export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface DaySlot {
  day: Weekday;
  enabled: boolean;
  from: string;
  to: string;
}

export interface DailyBreak {
  enabled: boolean;
  from: string;
  to: string;
}

export interface StaffAvailability {
  staffId: string;
  weekly: DaySlot[];
  dailyBreak?: DailyBreak;
}

export type LeaveType = "leave" | "holiday" | "blocked";

export interface StaffLeave {
  id: string;
  staffId: string;
  fromDate: string;
  toDate: string;
  reason: string;
  type: LeaveType;
}

export type CalendarCellState = "leave" | "unavailable" | "available" | "booking" | "offline" | "break";

const AVAIL_KEY = "shivai_appointmentcrm_availability";
const LEAVE_KEY = "shivai_appointmentcrm_leaves";
const SCHEDULE_EVENT = "shivai:appointment-schedule-changed";

export const WEEKDAYS: { key: Weekday; label: string }[] = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

const WEEKDAY_FROM_JS: Weekday[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export function defaultWeeklySchedule(): DaySlot[] {
  return WEEKDAYS.map(({ key }) => ({
    day: key,
    enabled: key !== "sun",
    from: key === "sat" ? "09:00" : "09:00",
    to: key === "sat" ? "13:00" : "17:00",
  }));
}

export function defaultDailyBreak(): DailyBreak {
  return { enabled: true, from: "13:00", to: "14:00" };
}

export function isMinuteInDailyBreak(
  availability: StaffAvailability,
  date: Date,
  minuteOfDay: number,
): boolean {
  const br = availability.dailyBreak ?? defaultDailyBreak();
  if (!br.enabled) return false;
  const weekday = WEEKDAY_FROM_JS[date.getDay()];
  const slot = availability.weekly.find((s) => s.day === weekday);
  if (!slot?.enabled) return false;
  const fromMin = parseTimeToMinutesLocal(br.from);
  const toMin = parseTimeToMinutesLocal(br.to);
  return minuteOfDay >= fromMin && minuteOfDay < toMin;
}

function makeLeaveId(): string {
  return `lv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function formatViewDate(d: Date): string {
  const today = toIsoDate(new Date());
  const iso = toIsoDate(d);
  if (iso === today) return "Today";
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (iso === toIsoDate(tomorrow)) return "Tomorrow";
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function parseHour(h: string): number {
  return parseInt(h.slice(0, 2), 10);
}

function parseTimeToMinutesLocal(time: string): number {
  const [hStr, mStr] = time.split(":");
  return parseInt(hStr, 10) * 60 + parseInt(mStr ?? "0", 10);
}

export function isMinuteInWeeklyAvailability(
  availability: StaffAvailability,
  date: Date,
  minuteOfDay: number,
): boolean {
  const weekday = WEEKDAY_FROM_JS[date.getDay()];
  const slot = availability.weekly.find((s) => s.day === weekday);
  if (!slot?.enabled) return false;
  const fromMin = parseTimeToMinutesLocal(slot.from);
  const toMin = parseTimeToMinutesLocal(slot.to);
  return minuteOfDay >= fromMin && minuteOfDay < toMin;
}

export function getSlotStateAtMinute(
  staffId: string,
  minuteOfDay: number,
  viewDate: Date,
  hasBooking: boolean,
): CalendarCellState {
  if (hasBooking) return "booking";
  const iso = toIsoDate(viewDate);
  const offline = getOfflineBlockAtMinute(staffId, iso, minuteOfDay);
  if (offline?.type === "manual_booking") return "offline";
  if (offline?.type === "break") return "break";
  if (offline?.type === "unavailable") return "unavailable";
  const leave = getLeaveOnDate(staffId, iso);
  if (leave) return "leave";
  const avail = getAvailabilityForStaff(staffId);
  if (isMinuteInDailyBreak(avail, viewDate, minuteOfDay)) return "break";
  if (!isMinuteInWeeklyAvailability(avail, viewDate, minuteOfDay)) return "unavailable";
  return "available";
}

export function readAvailability(): StaffAvailability[] {
  try {
    const raw = localStorage.getItem(AVAIL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeAvailability(list: StaffAvailability[]): void {
  try {
    localStorage.setItem(AVAIL_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(SCHEDULE_EVENT));
  } catch {
    /* ignore */
  }
}

export function readLeaves(): StaffLeave[] {
  try {
    const raw = localStorage.getItem(LEAVE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeLeaves(list: StaffLeave[]): void {
  try {
    localStorage.setItem(LEAVE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(SCHEDULE_EVENT));
  } catch {
    /* ignore */
  }
}

export function getAvailabilityForStaff(staffId: string): StaffAvailability {
  const found = readAvailability().find((a) => a.staffId === staffId);
  if (found) {
    return {
      ...found,
      dailyBreak: found.dailyBreak ?? defaultDailyBreak(),
    };
  }
  return { staffId, weekly: defaultWeeklySchedule(), dailyBreak: defaultDailyBreak() };
}

export function saveStaffAvailability(staffId: string, weekly: DaySlot[], dailyBreak?: DailyBreak): void {
  const existing = getAvailabilityForStaff(staffId);
  const list = readAvailability().filter((a) => a.staffId !== staffId);
  writeAvailability([
    ...list,
    {
      staffId,
      weekly,
      dailyBreak: dailyBreak ?? existing.dailyBreak ?? defaultDailyBreak(),
    },
  ]);
}

export function saveStaffDailyBreak(staffId: string, dailyBreak: DailyBreak): void {
  const existing = getAvailabilityForStaff(staffId);
  saveStaffAvailability(staffId, existing.weekly, dailyBreak);
}

export function ensureStaffAvailability(staffId: string): void {
  if (readAvailability().some((a) => a.staffId === staffId)) return;
  writeAvailability([
    ...readAvailability(),
    { staffId, weekly: defaultWeeklySchedule(), dailyBreak: defaultDailyBreak() },
  ]);
}

export function seedAvailabilityForStaff(staffIds: string[]): void {
  const existing = readAvailability();
  const missing = staffIds.filter((id) => !existing.some((a) => a.staffId === id));
  if (!missing.length) return;
  writeAvailability([
    ...existing,
    ...missing.map((staffId) => ({
      staffId,
      weekly: defaultWeeklySchedule(),
      dailyBreak: defaultDailyBreak(),
    })),
  ]);
}

export function removeAvailabilityForStaff(staffId: string): void {
  writeAvailability(readAvailability().filter((a) => a.staffId !== staffId));
  writeLeaves(readLeaves().filter((l) => l.staffId !== staffId));
  removeOfflineBlocksForStaff(staffId);
}

export function addStaffLeave(params: {
  staffId: string;
  fromDate: string;
  toDate: string;
  reason: string;
  type?: LeaveType;
}): StaffLeave {
  const leave: StaffLeave = {
    id: makeLeaveId(),
    staffId: params.staffId,
    fromDate: params.fromDate,
    toDate: params.toDate,
    reason: params.reason.trim() || "Leave",
    type: params.type ?? "leave",
  };
  writeLeaves([...readLeaves(), leave]);
  return leave;
}

export function removeStaffLeave(id: string): void {
  writeLeaves(readLeaves().filter((l) => l.id !== id));
}

export function getLeaveOnDate(staffId: string, isoDate: string): StaffLeave | undefined {
  return readLeaves().find(
    (l) => l.staffId === staffId && l.fromDate <= isoDate && l.toDate >= isoDate,
  );
}

export function isHourInWeeklyAvailability(
  availability: StaffAvailability,
  date: Date,
  hourLabel: string,
): boolean {
  const weekday = WEEKDAY_FROM_JS[date.getDay()];
  const slot = availability.weekly.find((s) => s.day === weekday);
  if (!slot?.enabled) return false;
  const h = parseHour(hourLabel);
  return h >= parseHour(slot.from) && h < parseHour(slot.to);
}

export function getCalendarCellState(
  staffId: string,
  hourLabel: string,
  viewDate: Date,
  hasBooking: boolean,
): CalendarCellState {
  if (hasBooking) return "booking";
  const leave = getLeaveOnDate(staffId, toIsoDate(viewDate));
  if (leave) return "leave";
  const avail = getAvailabilityForStaff(staffId);
  if (!isHourInWeeklyAvailability(avail, viewDate, hourLabel)) return "unavailable";
  return "available";
}

export function useStaffSchedule() {
  const [, force] = useState(0);
  useEffect(() => {
    const sync = () => force((n) => n + 1);
    window.addEventListener(SCHEDULE_EVENT, sync);
    window.addEventListener("shivai:appointment-staff-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SCHEDULE_EVENT, sync);
      window.removeEventListener("shivai:appointment-staff-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return {
    availability: readAvailability(),
    leaves: readLeaves(),
    getForStaff: getAvailabilityForStaff,
    getLeaveOnDate,
    saveWeekly: saveStaffAvailability,
    addLeave: addStaffLeave,
    removeLeave: removeStaffLeave,
    cellState: getCalendarCellState,
    slotStateAtMinute: getSlotStateAtMinute,
  };
}
