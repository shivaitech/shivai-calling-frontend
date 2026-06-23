import { useEffect, useState } from "react";
import { parseTimeToMinutes, formatTimeRangeCompact } from "./calendarUtils";
import { Branch } from "./branchesStore";
import { Department } from "./departmentsStore";
import { StaffMember } from "./staffStore";
import { toIsoDate } from "./availabilityStore";
import { getActiveIndustryId } from "./industryConfig";

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

const STORAGE_KEY = "shivai_appointmentcrm_offline_blocks";
const OFFLINE_EVENT = "shivai:appointment-schedule-changed";

function makeId(): string {
  return `ob-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function normalizeBlockType(type: string): OfflineBlockType {
  if (type === "offline_booking") return "manual_booking";
  if (type === "manual_booking" || type === "unavailable" || type === "break") return type;
  return "unavailable";
}

export function readOfflineBlocks(): StaffOfflineBlock[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((b: StaffOfflineBlock) => ({ ...b, type: normalizeBlockType(b.type) }));
  } catch {
    return [];
  }
}

function writeOfflineBlocks(list: StaffOfflineBlock[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(OFFLINE_EVENT));
  } catch {
    /* ignore */
  }
}

export function getOfflineBlocksForStaff(staffId: string): StaffOfflineBlock[] {
  return readOfflineBlocks().filter((b) => b.staffId === staffId);
}

export function getOfflineBlocksForStaffOnDate(staffId: string, isoDate: string): StaffOfflineBlock[] {
  return readOfflineBlocks().filter((b) => b.staffId === staffId && b.date === isoDate);
}

export function addOfflineBlock(params: {
  staffId: string;
  date: string;
  fromTime: string;
  toTime: string;
  type: OfflineBlockType;
  patientName?: string;
  patientId?: string;
  notes?: string;
}): StaffOfflineBlock {
  const fromMin = parseTimeToMinutes(params.fromTime);
  const toMin = parseTimeToMinutes(params.toTime);
  const block: StaffOfflineBlock = {
    id: makeId(),
    staffId: params.staffId,
    date: params.date,
    fromTime: params.fromTime,
    toTime: toMin > fromMin ? params.toTime : params.fromTime,
    type: params.type,
    patientName: params.patientName?.trim() || undefined,
    patientId: params.patientId?.trim() || undefined,
    notes: params.notes?.trim() || undefined,
  };
  writeOfflineBlocks([...readOfflineBlocks(), block]);
  return block;
}

export function isManualBookingBlock(block: StaffOfflineBlock): boolean {
  return block.type === "manual_booking";
}

export function blockTypeLabel(block: StaffOfflineBlock): string {
  if (block.type === "manual_booking") return "Manual booking";
  if (block.type === "break") return "Break";
  return "Unavailable";
}

export function removeOfflineBlock(id: string): void {
  writeOfflineBlocks(readOfflineBlocks().filter((b) => b.id !== id));
}

export function removeOfflineBlocksForStaff(staffId: string): void {
  writeOfflineBlocks(readOfflineBlocks().filter((b) => b.staffId !== staffId));
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
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(OFFLINE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return readOfflineBlocks();
}

function staffForDeptIndex(
  branchId: string,
  deptIndex: number,
  departments: Department[],
  staff: StaffMember[],
): StaffMember | undefined {
  const dept = departments.filter((d) => d.branchId === branchId)[deptIndex];
  if (!dept) return undefined;
  return staff.find((s) => s.departmentId === dept.id);
}

/** Demo offline bookings & blocked slots for hospital calendar. */
export function seedOfflineBlocksFromOrg(
  branches: Branch[],
  departments: Department[],
  staff: StaffMember[],
): StaffOfflineBlock[] {
  if (getActiveIndustryId() !== "hospital") return [];
  const existing = readOfflineBlocks();
  if (existing.length) return existing;

  const primaryBranch = branches.find((b) => b.isPrimary) ?? branches[0];
  if (!primaryBranch) return [];

  const today = toIsoDate(new Date());
  const general = staffForDeptIndex(primaryBranch.id, 0, departments, staff);
  const ortho = staffForDeptIndex(primaryBranch.id, 2, departments, staff);
  const cardio = staffForDeptIndex(primaryBranch.id, 1, departments, staff);

  const blocks: StaffOfflineBlock[] = [];

  if (general) {
    blocks.push({
      id: "ob-seed-walkin",
      staffId: general.id,
      date: today,
      fromTime: "10:00",
      toTime: "10:20",
      type: "manual_booking",
      patientName: "Priya Joshi",
      patientId: "UHID-10482",
      notes: "Walk-in / phone booking",
    });
  }
  if (ortho) {
    blocks.push({
      id: "ob-seed-surgery",
      staffId: ortho.id,
      date: today,
      fromTime: "12:00",
      toTime: "12:30",
      type: "unavailable",
      notes: "Surgery — OT block",
    });
  }
  if (cardio) {
    blocks.push({
      id: "ob-seed-meeting",
      staffId: cardio.id,
      date: today,
      fromTime: "03:30",
      toTime: "04:00",
      type: "unavailable",
      notes: "Department meeting",
    });
  }

  if (blocks.length) writeOfflineBlocks(blocks);
  return blocks;
}
