import { useMemo } from "react";
import {
  CALENDAR_DAY_END_MIN,
  CALENDAR_DAY_START_MIN,
  CALENDAR_SLOT_MINUTES,
  parseTimeToMinutes,
} from "./calendarUtils";
import { useBranches, type Branch, DEFAULT_BRANCH_CALENDAR } from "./branchesStore";

export { DEFAULT_BRANCH_CALENDAR };
export type { BranchCalendarHours } from "./branchesStore";

export interface ResolvedCalendarConfig {
  dayStart: string;
  dayEnd: string;
  dayStartMin: number;
  dayEndMin: number;
  slotMinutes: number;
}

export function resolveCalendarHours(branch?: Branch | null): ResolvedCalendarConfig {
  const dayStart = branch?.calendar?.dayStart ?? DEFAULT_BRANCH_CALENDAR.dayStart;
  const dayEnd = branch?.calendar?.dayEnd ?? DEFAULT_BRANCH_CALENDAR.dayEnd;
  return {
    dayStart,
    dayEnd,
    dayStartMin: parseTimeToMinutes(dayStart),
    dayEndMin: parseTimeToMinutes(dayEnd),
    slotMinutes: CALENDAR_SLOT_MINUTES,
  };
}

export function formatBranchCalendarHours(branch?: Branch | null): string {
  const { dayStart, dayEnd } = resolveCalendarHours(branch);
  return `${dayStart} – ${dayEnd}`;
}

export function isValidBranchCalendarHours(dayStart: string, dayEnd: string): boolean {
  const start = parseTimeToMinutes(dayStart);
  const end = parseTimeToMinutes(dayEnd);
  return end > start;
}

export function resolveCalendarHoursForBranch(
  branchId: string | null,
  branches: Branch[],
): ResolvedCalendarConfig {
  if (!branchId) {
    return {
      ...DEFAULT_BRANCH_CALENDAR,
      dayStartMin: CALENDAR_DAY_START_MIN,
      dayEndMin: CALENDAR_DAY_END_MIN,
      slotMinutes: CALENDAR_SLOT_MINUTES,
    };
  }
  const branch = branches.find((b) => b.id === branchId);
  return resolveCalendarHours(branch);
}

export function useCalendarConfig(branchId: string | null): ResolvedCalendarConfig {
  const branches = useBranches();
  return useMemo(
    () => resolveCalendarHoursForBranch(branchId, branches),
    [branchId, branches],
  );
}
