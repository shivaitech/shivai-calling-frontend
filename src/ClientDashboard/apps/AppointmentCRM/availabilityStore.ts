import { useEffect, useState } from "react";
import { getOfflineBlockAtMinute, removeOfflineBlocksForStaff, setOfflineBlocksQuiet } from "./offlineBlocksStore";
import scheduleAPI from "./api/scheduleAPI";
import { ScheduleApiError } from "./api/scheduleClient";
import type { ApiSchedule } from "./api/scheduleTypes";
import {
  leaveToApiBody,
  mapScheduleLeave,
  mapScheduleToAvailabilityAndLeaves,
  mapWeeklyFromApi,
  mapWeeklyToApi,
} from "./api/scheduleMappers";

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

export const SCHEDULE_EVENT = "shivai:appointment-schedule-changed";

// Availability/leaves always come from the Schedule API — these are
// in-memory caches of the last fetch/mutation response, never persisted to
// localStorage. `fetchedStaffIds` tracks who has a REAL fetch on record, so
// "not loaded yet" and "loaded with default hours" are distinguishable.
let memoryAvailability: StaffAvailability[] = [];
let memoryLeaves: StaffLeave[] = [];
const fetchedStaffIds = new Set<string>();
const inFlightFetches = new Map<string, Promise<void>>();

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

export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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
  return memoryAvailability;
}

function persistAvailability(list: StaffAvailability[]): void {
  memoryAvailability = list;
  window.dispatchEvent(new CustomEvent(SCHEDULE_EVENT));
}

export function writeAvailability(list: StaffAvailability[]): void {
  persistAvailability(list);
}

export function writeAvailabilityList(list: StaffAvailability[], opts?: { merge?: boolean }): void {
  if (opts?.merge) {
    const byStaff = new Map(memoryAvailability.map((a) => [a.staffId, a]));
    list.forEach((a) => byStaff.set(a.staffId, a));
    persistAvailability([...byStaff.values()]);
    return;
  }
  persistAvailability(list);
}

export function readLeaves(): StaffLeave[] {
  return memoryLeaves;
}

function persistLeaves(list: StaffLeave[]): void {
  memoryLeaves = list;
  window.dispatchEvent(new CustomEvent(SCHEDULE_EVENT));
}

export function writeLeaves(list: StaffLeave[]): void {
  persistLeaves(list);
}

export function writeLeavesList(list: StaffLeave[], opts?: { merge?: boolean }): void {
  if (opts?.merge) {
    const byId = new Map(memoryLeaves.map((l) => [l.id, l]));
    list.forEach((l) => byId.set(l.id, l));
    persistLeaves([...byId.values()]);
    return;
  }
  persistLeaves(list);
}

/** Replaces the cache without dispatching SCHEDULE_EVENT — for callers that
 * are themselves reacting to that event (e.g. useIntegratedSchedules
 * deriving availability/leaves from the same GET /schedules response), where
 * dispatching again would cause an infinite refetch loop. */
export function setAvailabilityListQuiet(list: StaffAvailability[]): void {
  memoryAvailability = list;
}
export function setLeavesListQuiet(list: StaffLeave[]): void {
  memoryLeaves = list;
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

export function hasFetchedScheduleFor(staffId: string): boolean {
  return fetchedStaffIds.has(staffId);
}

/** Loads the real schedule for one staff member from the API — the ONLY way
 * availability/leaves become trustworthy for that staff id (until this
 * resolves, getAvailabilityForStaff silently returns made-up defaults).
 * Safe to call repeatedly; concurrent calls for the same staff share one
 * in-flight request. */
export function fetchScheduleFor(staffId: string): Promise<void> {
  const inFlight = inFlightFetches.get(staffId);
  if (inFlight) return inFlight;

  const promise = scheduleAPI
    .fetchSchedule(staffId)
    .then((schedule) => {
      const weekly = mapWeeklyFromApi(schedule.weekly_availability);
      const withBreak = schedule.weekly_availability.find((d) => d.is_working && d.break?.enabled);
      const dailyBreak: DailyBreak | undefined = withBreak
        ? { enabled: true, from: withBreak.break.from, to: withBreak.break.to }
        : undefined;
      const list = readAvailability().filter((a) => a.staffId !== staffId);
      persistAvailability([...list, { staffId, weekly, dailyBreak }]);

      const otherLeaves = readLeaves().filter((l) => l.staffId !== staffId);
      const ownLeaves = schedule.leaves.map((l) => mapScheduleLeave(staffId, l));
      persistLeaves([...otherLeaves, ...ownLeaves]);

      fetchedStaffIds.add(staffId);
    })
    .catch(() => {
      // Schedule doesn't exist yet (404) or request failed — leave the
      // staff id unmarked so getAvailabilityForStaff's defaults are used,
      // and a later retry (e.g. reopening the modal) can try again.
    })
    .finally(() => {
      inFlightFetches.delete(staffId);
    });

  inFlightFetches.set(staffId, promise);
  return promise;
}

/** Every live schedule the caller can see — the Schedule API's own GET
 * /schedules list, paginated at up to 100 per page, each with its staff
 * summary attached. This is the backend's single source of truth for who is
 * "integrated": the Calendar builds its staff list directly from this
 * rather than cross-referencing a separate branch StaffMember record, so a
 * schedule can never be orphaned-looking (visible here, invisible there) or
 * vice versa. */
export async function fetchIntegratedSchedules(): Promise<ApiSchedule[]> {
  const all: ApiSchedule[] = [];
  let page = 1;
  const limit = 100;
  for (;;) {
    const schedules = await scheduleAPI.listSchedules({ page, limit });
    all.push(...schedules);
    if (schedules.length < limit) break;
    page += 1;
  }
  return all;
}

/** Every staff id that has a real, live schedule — a thin projection of
 * fetchIntegratedSchedules() for callers that only need membership, not the
 * full records (e.g. the Integrate Staff picker's "already added" check). */
export async function fetchIntegratedStaffIds(): Promise<Set<string>> {
  const schedules = await fetchIntegratedSchedules();
  return new Set(schedules.map((s) => s.staff_id));
}

export function useIntegratedStaffIds(): { staffIds: Set<string>; loading: boolean } {
  const [staffIds, setStaffIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const sync = () => {
      setLoading(true);
      fetchIntegratedStaffIds()
        .then((ids) => {
          if (!cancelled) setStaffIds(ids);
        })
        .catch(() => {
          if (!cancelled) setStaffIds(new Set());
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };
    sync();
    window.addEventListener(SCHEDULE_EVENT, sync);
    return () => {
      cancelled = true;
      window.removeEventListener(SCHEDULE_EVENT, sync);
    };
  }, []);

  return { staffIds, loading };
}

/** The Calendar's real source of truth for who to show — full schedule
 * records (with staff summaries) rather than just ids, re-fetched whenever
 * any schedule mutation fires SCHEDULE_EVENT.
 *
 * Each fetch already carries every staff member's weekly_availability,
 * leaves and break blocks in one shot, so it also derives and quiet-caches
 * StaffAvailability/StaffLeave/StaffOfflineBlock from it — the only other
 * way those caches get populated is one-staff-at-a-time when their schedule
 * panel happens to be opened, which left the main Calendar grid's "on
 * leave"/non-working-day/break shading blank for anyone whose panel hadn't
 * been opened yet this session. */
export function useIntegratedSchedules(): { schedules: ApiSchedule[]; loading: boolean } {
  const [schedules, setSchedules] = useState<ApiSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const sync = () => {
      setLoading(true);
      fetchIntegratedSchedules()
        .then((list) => {
          if (cancelled) return;
          setSchedules(list);
          const derived = list.map((s) => mapScheduleToAvailabilityAndLeaves(s));
          setAvailabilityListQuiet(derived.map((d) => d.availability));
          setLeavesListQuiet(derived.flatMap((d) => d.leaves));
          setOfflineBlocksQuiet(derived.flatMap((d) => d.blocks));
          list.forEach((s) => fetchedStaffIds.add(s.staff_id));
        })
        .catch(() => {
          if (!cancelled) setSchedules([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };
    sync();
    window.addEventListener(SCHEDULE_EVENT, sync);
    return () => {
      cancelled = true;
      window.removeEventListener(SCHEDULE_EVENT, sync);
    };
  }, []);

  return { schedules, loading };
}

export async function saveStaffAvailability(
  staffId: string,
  weekly: DaySlot[],
  dailyBreak?: DailyBreak,
): Promise<void> {
  const existing = getAvailabilityForStaff(staffId);
  const effectiveBreak = dailyBreak ?? existing.dailyBreak ?? defaultDailyBreak();
  const next: StaffAvailability = { staffId, weekly, dailyBreak: effectiveBreak };
  const weekly_availability = mapWeeklyToApi(weekly, effectiveBreak);
  try {
    await scheduleAPI.updateSchedule(staffId, { weekly_availability });
  } catch (err) {
    // No schedule document exists yet for this staff member (first-ever
    // save) — PUT 404s until one is created with POST.
    if (err instanceof ScheduleApiError && err.statusCode === 404) {
      await scheduleAPI.createSchedule({ staff_id: staffId, weekly_availability });
    } else {
      throw err;
    }
  }
  const list = readAvailability().filter((a) => a.staffId !== staffId);
  persistAvailability([...list, next]);
  fetchedStaffIds.add(staffId);
}

export function saveStaffDailyBreak(staffId: string, dailyBreak: DailyBreak): void {
  const existing = getAvailabilityForStaff(staffId);
  void saveStaffAvailability(staffId, existing.weekly, dailyBreak);
}

/** Pushes a sensible default schedule for a newly-created staff member who
 * has none yet — a real API write, not a local-only placeholder. */
export async function ensureStaffAvailability(staffId: string): Promise<void> {
  if (readAvailability().some((a) => a.staffId === staffId)) return;
  // This staff member is brand new — create their schedule directly (POST)
  // rather than probing with PUT first (which always 404s with nothing to
  // update yet, generating a noisy failed request for no reason).
  const weekly = defaultWeeklySchedule();
  const dailyBreak = defaultDailyBreak();
  const weekly_availability = mapWeeklyToApi(weekly, dailyBreak);
  try {
    await scheduleAPI.createSchedule({ staff_id: staffId, weekly_availability });
  } catch (err) {
    // A schedule already exists (409) — fine, nothing to do.
    if (!(err instanceof ScheduleApiError) || err.statusCode !== 409) throw err;
  }
  const list = readAvailability().filter((a) => a.staffId !== staffId);
  persistAvailability([...list, { staffId, weekly, dailyBreak }]);
  fetchedStaffIds.add(staffId);
}

/** Deletes the staff member's Schedule API document (hours, breaks, leaves,
 * blocks) and clears the local cache. 404s are swallowed — a staff member
 * who never got a schedule set up has nothing to delete. */
export async function removeAvailabilityForStaff(staffId: string): Promise<void> {
  try {
    await scheduleAPI.deleteSchedule(staffId);
  } catch (err) {
    if (!(err instanceof ScheduleApiError) || err.statusCode !== 404) throw err;
  }
  persistAvailability(readAvailability().filter((a) => a.staffId !== staffId));
  persistLeaves(readLeaves().filter((l) => l.staffId !== staffId));
  fetchedStaffIds.delete(staffId);
  removeOfflineBlocksForStaff(staffId);
}

export async function addStaffLeave(params: {
  staffId: string;
  fromDate: string;
  toDate: string;
  reason: string;
  type?: LeaveType;
}): Promise<StaffLeave> {
  const schedule = await scheduleAPI.addScheduleLeave(
    params.staffId,
    leaveToApiBody({ fromDate: params.fromDate, toDate: params.toDate, reason: params.reason }),
  );
  const leaves = schedule.leaves.map((l) => mapScheduleLeave(params.staffId, l));
  const others = readLeaves().filter((l) => l.staffId !== params.staffId);
  persistLeaves([...others, ...leaves]);
  return leaves[leaves.length - 1] ?? {
    id: "",
    staffId: params.staffId,
    fromDate: params.fromDate,
    toDate: params.toDate,
    reason: params.reason.trim() || "Leave",
    type: params.type ?? "leave",
  };
}

export async function removeStaffLeave(staffId: string, id: string): Promise<void> {
  const schedule = await scheduleAPI.removeScheduleLeave(staffId, id);
  const leaves = schedule.leaves.map((l) => mapScheduleLeave(staffId, l));
  const others = readLeaves().filter((l) => l.staffId !== staffId);
  persistLeaves([...others, ...leaves]);
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
    return () => {
      window.removeEventListener(SCHEDULE_EVENT, sync);
      window.removeEventListener("shivai:appointment-staff-changed", sync);
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
