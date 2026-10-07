import { useEffect, useState } from "react";
import { parseTimeToMinutes, formatTimeRangeCompact } from "./calendarUtils";
import scheduleAPI from "./api/scheduleAPI";
import { blockToApiBody, mapScheduleBlock } from "./api/scheduleMappers";

export type OfflineBlockType = "manual_booking" | "unavailable" | "break";

export interface StaffOfflineBlock {
  id: string;
  staffId: string;
  date: string;
  fromTime: string;
  toTime: string;
  type: OfflineBlockType;
  patientName?: string;
  patientId?: string;
  notes?: string;
}

const OFFLINE_EVENT = "shivai:appointment-schedule-changed";

// Offline blocks always come from the API — this is an in-memory cache of
// the last fetch/mutation response, never persisted to localStorage.
let memoryOfflineBlocks: StaffOfflineBlock[] = [];

function persistOfflineBlocks(list: StaffOfflineBlock[]): void {
  memoryOfflineBlocks = list;
  window.dispatchEvent(new CustomEvent(OFFLINE_EVENT));
}

export function writeOfflineBlocks(list: StaffOfflineBlock[], opts?: { merge?: boolean }): void {
  if (opts?.merge) {
    const byId = new Map(memoryOfflineBlocks.map((b) => [b.id, b]));
    list.forEach((b) => byId.set(b.id, b));
    persistOfflineBlocks([...byId.values()]);
    return;
  }
  persistOfflineBlocks(list);
}

export function readOfflineBlocks(): StaffOfflineBlock[] {
  return memoryOfflineBlocks;
}

function replaceBlocksForStaff(staffId: string, blocks: StaffOfflineBlock[]): void {
  const others = readOfflineBlocks().filter((b) => b.staffId !== staffId);
  persistOfflineBlocks([...others, ...blocks]);
}

export async function addOfflineBlock(params: {
  staffId: string;
  date: string;
  fromTime: string;
  toTime: string;
  type: OfflineBlockType;
  patientName?: string;
  patientId?: string;
  notes?: string;
  branchId?: string;
}): Promise<StaffOfflineBlock> {
  const fromMin = parseTimeToMinutes(params.fromTime);
  const toMin = parseTimeToMinutes(params.toTime);
  if (fromMin >= toMin) throw new Error("End time must be after start time");
  const schedule = await scheduleAPI.addScheduleBlock(
    params.staffId,
    blockToApiBody({
      type: params.type,
      date: params.date,
      fromTime: params.fromTime,
      toTime: params.toTime,
      patientName: params.patientName,
      patientId: params.patientId,
      notes: params.notes,
    }),
  );
  const blocks = schedule.blocks.map((b) => mapScheduleBlock(params.staffId, b));
  replaceBlocksForStaff(params.staffId, blocks);
  const created = blocks.find(
    (b) => b.date === params.date && b.fromTime === params.fromTime && b.toTime === params.toTime,
  );
  return created ?? blocks[blocks.length - 1];
}

export async function removeOfflineBlock(staffId: string, id: string): Promise<void> {
  const schedule = await scheduleAPI.removeScheduleBlock(staffId, id);
  const blocks = schedule.blocks.map((b) => mapScheduleBlock(staffId, b));
  replaceBlocksForStaff(staffId, blocks);
}

export function getOfflineBlocksForStaff(staffId: string): StaffOfflineBlock[] {
  return readOfflineBlocks().filter((b) => b.staffId === staffId);
}

export function getOfflineBlocksForStaffOnDate(staffId: string, isoDate: string): StaffOfflineBlock[] {
  return readOfflineBlocks().filter((b) => b.staffId === staffId && b.date === isoDate);
}

export function isManualBookingBlock(block: StaffOfflineBlock): boolean {
  return block.type === "manual_booking";
}

export function blockTypeLabel(block: StaffOfflineBlock): string {
  if (block.type === "manual_booking") return "Manual booking";
  if (block.type === "break") return "Break";
  return "Unavailable";
}

export function removeOfflineBlocksForStaff(staffId: string): void {
  persistOfflineBlocks(readOfflineBlocks().filter((b) => b.staffId !== staffId));
}

export function getBlockStartMinutes(block: StaffOfflineBlock): number {
  return parseTimeToMinutes(block.fromTime);
}

export function getBlockDurationMinutes(block: StaffOfflineBlock): number {
  const start = parseTimeToMinutes(block.fromTime);
  const end = parseTimeToMinutes(block.toTime);
  return Math.max(end - start, 15);
}

export function offlineBlockOverlapsSlot(
  block: StaffOfflineBlock,
  slotStartMin: number,
  slotMinutes = 15,
): boolean {
  const bStart = getBlockStartMinutes(block);
  const bEnd = bStart + getBlockDurationMinutes(block);
  const slotEnd = slotStartMin + slotMinutes;
  return bStart < slotEnd && bEnd > slotStartMin;
}

export function getOfflineBlockAtMinute(
  staffId: string,
  isoDate: string,
  minuteOfDay: number,
): StaffOfflineBlock | undefined {
  return getOfflineBlocksForStaffOnDate(staffId, isoDate).find((b) => {
    const start = getBlockStartMinutes(b);
    const end = start + getBlockDurationMinutes(b);
    return minuteOfDay >= start && minuteOfDay < end;
  });
}

export function formatBlockTimeRange(block: StaffOfflineBlock): string {
  return formatTimeRangeCompact(getBlockStartMinutes(block), getBlockDurationMinutes(block));
}

export function useOfflineBlocks() {
  const [, force] = useState(0);
  useEffect(() => {
    const sync = () => force((n) => n + 1);
    window.addEventListener(OFFLINE_EVENT, sync);
    return () => window.removeEventListener(OFFLINE_EVENT, sync);
  }, []);
  return readOfflineBlocks();
}
