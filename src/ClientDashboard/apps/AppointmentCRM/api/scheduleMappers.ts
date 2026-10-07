import type { DailyBreak, DaySlot, StaffAvailability, StaffLeave, Weekday } from "../availabilityStore";
import type { OfflineBlockType, StaffOfflineBlock } from "../offlineBlocksStore";
import type {
  ApiSchedule,
  ApiScheduleBlock,
  ApiScheduleBlockType,
  ApiScheduleLeave,
  ApiWeeklyAvailabilityDay,
} from "./scheduleTypes";

// The Schedule API numbers days Sunday=0…Saturday=6; the UI's Weekday keys
// are Monday-first strings. This is the single place that translates between
// the two — never duplicate this table elsewhere.
const DAY_INDEX_TO_WEEKDAY: Weekday[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const WEEKDAY_TO_DAY_INDEX: Record<Weekday, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

export function mapWeeklyFromApi(days: ApiWeeklyAvailabilityDay[]): DaySlot[] {
  // Always return exactly 7 entries, one per Weekday, regardless of what the
  // API sent — StaffAvailabilityPanel does a non-null find() per day.
  const byIndex = new Map(days.map((d) => [d.day, d]));
  return DAY_INDEX_TO_WEEKDAY.map((weekday, dayIndex) => {
    const apiDay = byIndex.get(dayIndex);
    return {
      day: weekday,
      enabled: apiDay?.is_working ?? false,
      from: apiDay?.from ?? "",
      to: apiDay?.to ?? "",
    };
  });
}

export function mapDailyBreakFromApi(days: ApiWeeklyAvailabilityDay[]): DailyBreak | undefined {
  // The recurring break lives on each working day rather than as one shared
  // field — use the first working day's break as the UI's single value (the
  // "Daily lunch / break" control writes the same object into all 7 on save).
  const withBreak = days.find((d) => d.is_working && d.break?.enabled);
  if (!withBreak) return undefined;
  return { enabled: true, from: withBreak.break.from, to: withBreak.break.to };
}

export function mapWeeklyToApi(weekly: DaySlot[], dailyBreak?: DailyBreak): ApiWeeklyAvailabilityDay[] {
  return weekly.map((slot) => ({
    day: WEEKDAY_TO_DAY_INDEX[slot.day],
    is_working: slot.enabled,
    from: slot.enabled ? slot.from : "",
    to: slot.enabled ? slot.to : "",
    break: slot.enabled && dailyBreak?.enabled
      ? { enabled: true, from: dailyBreak.from, to: dailyBreak.to }
      : { enabled: false, from: "", to: "" },
  }));
}

export function mapScheduleAvailability(staffId: string, schedule: ApiSchedule): StaffAvailability {
  return {
    staffId,
    weekly: mapWeeklyFromApi(schedule.weekly_availability),
    dailyBreak: mapDailyBreakFromApi(schedule.weekly_availability),
  };
}

export function mapScheduleLeave(staffId: string, leave: ApiScheduleLeave): StaffLeave {
  return {
    id: leave.id,
    staffId,
    fromDate: leave.from_date,
    toDate: leave.to_date,
    reason: leave.reason || "Leave",
    type: "leave",
  };
}

export function leaveToApiBody(params: { fromDate: string; toDate: string; reason?: string }) {
  return {
    from_date: params.fromDate,
    to_date: params.toDate,
    reason: params.reason?.trim() || undefined,
  };
}

const BLOCK_TYPE_TO_API: Record<OfflineBlockType, ApiScheduleBlockType> = {
  manual_booking: "manual_booking",
  unavailable: "unavailable",
  break: "break",
};

export function mapScheduleBlock(staffId: string, block: ApiScheduleBlock): StaffOfflineBlock {
  return {
    id: block.id,
    staffId,
    date: block.date,
    fromTime: block.from,
    toTime: block.to,
    type: block.type,
    patientName: block.patient_name || undefined,
    patientId: block.patient_id || undefined,
    notes: block.notes || undefined,
  };
}

export function blockToApiBody(params: {
  type: OfflineBlockType;
  date: string;
  fromTime: string;
  toTime: string;
  patientName?: string;
  patientId?: string;
  notes?: string;
}) {
  return {
    type: BLOCK_TYPE_TO_API[params.type],
    date: params.date,
    from: params.fromTime,
    to: params.toTime,
    patient_name: params.type === "manual_booking" ? params.patientName?.trim() || undefined : undefined,
    patient_id: params.type === "manual_booking" ? params.patientId?.trim() || undefined : undefined,
    notes: params.notes?.trim() || undefined,
  };
}

export function mapScheduleToAvailabilityAndLeaves(schedule: ApiSchedule): {
  availability: StaffAvailability;
  leaves: StaffLeave[];
  blocks: StaffOfflineBlock[];
} {
  const staffId = schedule.staff_id;
  return {
    availability: mapScheduleAvailability(staffId, schedule),
    leaves: schedule.leaves.map((l) => mapScheduleLeave(staffId, l)),
    blocks: schedule.blocks.map((b) => mapScheduleBlock(staffId, b)),
  };
}
